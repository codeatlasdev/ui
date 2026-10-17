import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import type { CommandResult } from "./CommandPalette.svelte";
import Harness from "./CommandPaletteAsync.test.svelte";

const palette = () => page.getByRole("dialog", { name: "Command palette" });
const input = () => page.getByPlaceholder("Search…");

const records: CommandResult[] = [
	{ id: "i1", label: "Invoice 1042", group: "Invoices", path: "/invoices/1042" },
	{ id: "i2", label: "Invoice 1043", group: "Invoices", path: "/invoices/1043" },
	{ id: "c1", label: "Acme Corp", group: "Customers", path: "/customers/acme" },
];

/** A search whose promises the test resolves by hand, so loading and abort are observable. */
function manualSearch() {
	const calls: {
		query: string;
		signal: AbortSignal;
		resolve(r: CommandResult[]): void;
		reject(e: unknown): void;
	}[] = [];
	const search = vi.fn(
		(query: string, signal: AbortSignal) =>
			new Promise<CommandResult[]>((resolve, reject) => {
				calls.push({ query, signal, resolve, reject });
				signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
			})
	);
	return { search, calls };
}

const open = async (props: Record<string, unknown>) => {
	const screen = await render(Harness, props as never);
	await screen.getByRole("button", { name: "Open palette" }).click();
	await expect.element(palette()).toBeVisible();
	await expect.element(input()).toHaveFocus();
	return screen;
};

describe("CommandPalette async search (#293)", () => {
	it("search is debounced: one call after the window, results grouped", async () => {
		const search = vi.fn(async (_query: string, _signal: AbortSignal) => records);
		await open({ search, debounce: 300 });
		await input().fill("inv");
		expect(search).not.toHaveBeenCalled();
		await expect.element(page.getByRole("option", { name: /Invoice 1042/ })).toBeVisible();
		expect(search).toHaveBeenCalledTimes(1);
		expect(search.mock.calls[0][0]).toBe("inv");
		expect(search.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
		await expect.element(page.getByText("Invoices", { exact: true })).toBeVisible();
		await expect.element(page.getByText("Customers", { exact: true })).toBeVisible();
	});

	it("typing again within the debounce window searches only the final query", async () => {
		const search = vi.fn(async (_query: string, _signal: AbortSignal) => records);
		await open({ search, debounce: 150 });
		await userEvent.keyboard("inv");
		await expect.element(page.getByRole("option", { name: /Invoice 1042/ })).toBeVisible();
		expect(search).toHaveBeenCalledTimes(1);
		expect(search.mock.calls[0][0]).toBe("inv");
	});

	it("shows a busy loading state while pending and aborts the stale request on a new query", async () => {
		const { search, calls } = manualSearch();
		await open({ search });
		await input().fill("a");
		await expect.poll(() => calls.length).toBe(1);
		await expect.element(page.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
		await expect.element(page.getByText("Searching…")).toBeVisible();

		await input().fill("ab");
		await expect.poll(() => calls.length).toBe(2);
		expect(calls[0].signal.aborted).toBe(true);
		expect(calls[1].signal.aborted).toBe(false);

		// The stale answer arrives late and must never replace the current results.
		calls[0].resolve([{ id: "stale", label: "Stale hit", path: "/stale" }]);
		calls[1].resolve([{ id: "fresh", label: "Fresh hit", path: "/fresh" }]);
		await expect.element(page.getByRole("option", { name: /Fresh hit/ })).toBeVisible();
		await expect.element(page.getByRole("option", { name: /Stale hit/ })).not.toBeInTheDocument();
		await expect.element(page.getByRole("listbox")).not.toHaveAttribute("aria-busy", "true");
	});

	it("aborts the pending request when the palette closes", async () => {
		const { search, calls } = manualSearch();
		await open({ search });
		await input().fill("x");
		await expect.poll(() => calls.length).toBe(1);
		await userEvent.keyboard("{Escape}");
		await expect.element(palette()).not.toBeInTheDocument();
		expect(calls[0].signal.aborted).toBe(true);
	});

	it("keeps local matches and appends the server results after them", async () => {
		const search = vi.fn(async (_query: string, _signal: AbortSignal) => records);
		await open({ search });
		await input().fill("re");
		await expect.element(page.getByRole("option", { name: /Invoice 1042/ })).toBeVisible();
		const names = page
			.getByRole("option")
			.elements()
			.map((o) => o.textContent ?? "");
		expect(names[0]).toContain("Reports");
		expect(names.at(-1)).toContain("Acme Corp");
	});

	it("shows the empty state only after the search settles with nothing", async () => {
		const { search, calls } = manualSearch();
		await open({ search, withModules: false });
		await input().fill("zzz");
		await expect.poll(() => calls.length).toBe(1);
		await expect.element(page.getByText('No results for "zzz"')).not.toBeInTheDocument();
		calls[0].resolve([]);
		await expect.element(page.getByText('No results for "zzz"')).toBeVisible();
	});

	it("a failed search shows an error row and does not break the list", async () => {
		const search = vi.fn(async () => {
			throw new Error("boom");
		});
		await open({ search });
		await input().fill("re");
		await expect.element(page.getByText("Search failed")).toBeVisible();
		await expect.element(page.getByRole("option", { name: /Reports/ })).toBeVisible();
	});

	it("announces loading, the result count and the empty outcome through announce()", async () => {
		const search = vi.fn(async (q: string) => (q === "none" ? [] : records));
		await open({ search });
		const live = () => document.querySelector('[data-ca-announcer="polite"]')?.textContent ?? "";
		await input().fill("inv");
		await expect.poll(live).toMatch(/3 results/);
		await input().fill("none");
		await expect.poll(live).toMatch(/No results/);
	});

	it("Enter on a server result navigates to its path, or calls onSelect when given", async () => {
		const onNavigate = vi.fn();
		const search = vi.fn(async (_query: string, _signal: AbortSignal) => records);
		await open({ search, onNavigate, withModules: false });
		await input().fill("inv");
		await expect.element(page.getByRole("option", { name: /Invoice 1042/ })).toBeVisible();
		await userEvent.keyboard("{ArrowDown}{Enter}");
		expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/invoices/1043");
	});

	it("onSelect receives the whole result and replaces navigation", async () => {
		const onNavigate = vi.fn();
		const onSelect = vi.fn();
		const search = vi.fn(async (_query: string, _signal: AbortSignal) => records);
		await open({ search, onNavigate, onSelect, withModules: false });
		await input().fill("inv");
		await page.getByRole("option", { name: /Acme Corp/ }).click();
		expect(onSelect).toHaveBeenCalledExactlyOnceWith(records[2]);
		expect(onNavigate).not.toHaveBeenCalled();
	});

	it("bind:query reflects the input, and minQueryLength gates the server call", async () => {
		const search = vi.fn(async (_query: string, _signal: AbortSignal) => records);
		const screen = await open({ search, minQueryLength: 3 });
		await input().fill("in");
		await expect.element(screen.getByTestId("query")).toHaveTextContent("in");
		await new Promise((r) => setTimeout(r, 120));
		expect(search).not.toHaveBeenCalled();
		await input().fill("inv");
		await expect.element(page.getByRole("option", { name: /Invoice 1042/ })).toBeVisible();
		expect(search).toHaveBeenCalledTimes(1);
	});

	it("reopening starts clean: no stale server results, query reset (#97)", async () => {
		const search = vi.fn(async (_query: string, _signal: AbortSignal) => records);
		const screen = await open({ search });
		await input().fill("inv");
		await expect.element(page.getByRole("option", { name: /Invoice 1042/ })).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(palette()).not.toBeInTheDocument();
		await screen.getByRole("button", { name: "Open palette" }).click();
		await expect.element(input()).toHaveValue("");
		await expect.element(input()).toHaveFocus();
		await expect
			.element(page.getByRole("option", { name: /Invoice 1042/ }))
			.not.toBeInTheDocument();
	});

	it("axe passes loading, with results, empty and failed", async () => {
		const { search, calls } = manualSearch();
		await open({ search, withModules: false });
		await input().fill("a");
		await expect.poll(() => calls.length).toBe(1);
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
		calls[0].resolve(records);
		await expect.element(page.getByRole("option", { name: /Invoice 1042/ })).toBeVisible();
		expect(await checkA11y(document.body)).toHaveNoViolations();
		await input().fill("b");
		await expect.poll(() => calls.length).toBe(2);
		calls[1].resolve([]);
		await expect.element(page.getByText('No results for "b"')).toBeVisible();
		expect(await checkA11y(document.body)).toHaveNoViolations();
		await input().fill("c");
		await expect.poll(() => calls.length).toBe(3);
		calls[2].reject(new Error("boom"));
		await expect.element(page.getByText("Search failed")).toBeVisible();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});
});
