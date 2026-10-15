import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { onLayerChange } from "../../primitives/index.js";
import Harness from "./NestedLayers.test.svelte";

const stops: Array<() => void> = [];
afterEach(() => {
	while (stops.length) stops.pop()?.();
});

async function openMenuInDialog(props: Record<string, unknown> = {}) {
	const screen = await render(Harness, props);
	const opener = screen.getByRole("button", { name: "Open dialog" });
	await opener.click();
	await expect.element(page.getByRole("dialog")).toBeVisible();
	const trigger = page.getByRole("button", { name: "Actions" });
	await trigger.click();
	await expect.element(page.getByRole("menu")).toBeVisible();
	return { screen, opener, trigger };
}

describe("nested layers (menu inside a dialog)", () => {
	it("the menu is on top of the dialog and clickable, with no z-index involved", async () => {
		await openMenuInDialog();
		const menu = document.querySelector('[role="menu"]') as HTMLElement;
		const dialog = document.querySelector("dialog") as HTMLDialogElement;
		expect(menu.matches(":popover-open")).toBe(true);
		expect(dialog.matches(":modal")).toBe(true);
		expect(getComputedStyle(menu).zIndex).toBe("auto");

		const r = menu.getBoundingClientRect();
		const hit = document.elementFromPoint(r.left + r.width / 2, r.top + 12);
		expect(menu.contains(hit)).toBe(true);
	});

	it("Escape closes the menu first, then the dialog, one layer per press", async () => {
		const onOpenChange = vi.fn();
		const { opener } = await openMenuInDialog({ onOpenChange });

		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(page.getByRole("dialog")).toBeVisible();
		expect(onOpenChange).not.toHaveBeenCalled();

		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		await expect.element(opener).toHaveFocus();
	});

	it("closing the menu returns focus to its trigger inside the dialog", async () => {
		const { trigger } = await openMenuInDialog();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
	});

	it("an outside press on the dialog body closes only the menu", async () => {
		await openMenuInDialog();
		await page.getByRole("heading", { name: "Settings" }).click();
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(page.getByRole("dialog")).toBeVisible();
	});

	it("a tooltip opened inside a dialog is above it and does not take Escape", async () => {
		await render(Harness);
		await page.getByRole("button", { name: "Open dialog" }).click();
		await userEvent.hover(page.getByRole("button", { name: "Hint" }));
		const tip = page.getByRole("tooltip");
		await expect.element(tip).toBeVisible();
		expect((tip.element() as HTMLElement).matches(":popover-open")).toBe(true);
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("layerchange fires on open and close, reporting the stack and the modal flag", async () => {
		const seen: Array<{ kinds: string[]; modal: boolean }> = [];
		stops.push(
			onLayerChange((d) => seen.push({ kinds: d.layers.map((l) => l.kind), modal: d.modal }))
		);
		await openMenuInDialog();
		expect(seen[0]).toEqual({ kinds: ["modal"], modal: true });
		expect(seen.at(-1)).toEqual({ kinds: ["modal", "popover"], modal: true });

		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect.poll(() => seen.at(-1)).toEqual({ kinds: [], modal: false });
		// Every change is one layer more or less than the one before it.
		const counts = [0, ...seen.map((e) => e.kinds.length)];
		for (let i = 1; i < counts.length; i++) expect(Math.abs(counts[i] - counts[i - 1])).toBe(1);
	});

	it("has no axe violations with the menu open over the dialog", async () => {
		await openMenuInDialog();
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});
});
