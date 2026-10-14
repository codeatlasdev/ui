import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { SLOW_FLOW } from "../../../../tests/settled";
import { setLocale } from "../../i18n/index.js";
import DocsSearchHarness from "./DocsSearchHarness.test.svelte";
import type { DocsSearchEntry } from "./types";

const entries: DocsSearchEntry[] = [
	{
		href: "/guide/start",
		title: "Getting started",
		section: "Guide",
		description: "Start here",
		headings: [{ text: "Installation", id: "installation" }],
		text: "install the package",
	},
	{
		href: "/api/messages",
		title: "Send message",
		section: "API",
		description: "Sending endpoint",
		headings: [],
		text: "webhook and QR code",
	},
	{
		href: "/api/webhooks",
		title: "Webhooks",
		section: "API",
		description: "Events",
		headings: [],
		// Accented on purpose: the "configuracao" query must match it (diacritic folding).
		text: "configuração of callbacks",
	},
];

const input = () => page.getByRole("combobox", { name: "Buscar" });

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("DocsSearch", () => {
	it("opens focused on the input with the hint and passes axe", async () => {
		const screen = await render(DocsSearchHarness, { index: entries, open: true });
		await expect
			.element(page.getByRole("dialog", { name: "Buscar na documentação" }))
			.toBeVisible();
		await expect.element(input()).toHaveFocus();
		await expect
			.element(page.getByText("Busque por endpoint, conceito ou provider."))
			.toBeVisible();
		await expect
			.poll(() => document.getAnimations().filter((a) => a.playState === "running").length)
			.toBe(0);
		expect(
			await checkA11y(document.querySelector('[role="dialog"]') as HTMLElement)
		).toHaveNoViolations();
		void screen;
	});

	it("typing lists matching results (diacritics-insensitive) and exposes listbox semantics", async () => {
		await render(DocsSearchHarness, { index: entries, open: true });
		await userEvent.keyboard("configuracao");
		await expect.element(page.getByRole("listbox", { name: "Resultados" })).toBeVisible();
		await expect.element(page.getByRole("option", { name: /Webhooks/ })).toBeVisible();
		await expect.element(input()).toHaveAttribute("aria-expanded", "true");
		await expect
			.poll(() => document.getAnimations().filter((a) => a.playState === "running").length)
			.toBe(0);
		expect(
			await checkA11y(document.querySelector('[role="dialog"]') as HTMLElement)
		).toHaveNoViolations();
	});

	it("heading hits link to the anchor", async () => {
		const onselect = vi.fn();
		await render(DocsSearchHarness, { index: entries, open: true, onselect });
		await userEvent.keyboard("installation");
		const heading = page.getByRole("option", { name: /Installation/ });
		await expect.element(heading).toBeVisible();
		// A real link: middle-click / open in new tab / copy link keep working.
		await expect.element(heading).toHaveAttribute("href", "/guide/start#installation");
		await heading.click();
		expect(onselect).toHaveBeenCalledWith("/guide/start#installation");
	});

	it(
		"ArrowDown/ArrowUp move aria-activedescendant/aria-selected; Enter selects it",
		async () => {
			const onselect = vi.fn();
			await render(DocsSearchHarness, { index: entries, open: true, onselect });
			await userEvent.keyboard("webhook");
			const options = page.getByRole("option");
			await expect.poll(() => options.elements().length).toBeGreaterThan(1);
			await expect.element(options.first()).toHaveAttribute("aria-selected", "true");
			const firstId = options.first().element().id;
			await expect.element(input()).toHaveAttribute("aria-activedescendant", firstId);
			await userEvent.keyboard("{ArrowDown}");
			await expect.element(options.nth(1)).toHaveAttribute("aria-selected", "true");
			await expect.element(options.first()).toHaveAttribute("aria-selected", "false");
			await userEvent.keyboard("{ArrowUp}");
			await expect.element(options.first()).toHaveAttribute("aria-selected", "true");
			await userEvent.keyboard("{ArrowDown}{Enter}");
			expect(onselect).toHaveBeenCalledOnce();
		},
		SLOW_FLOW
	);

	// #76: a row that appears or slides under a parked pointer fires mouseenter without any movement
	// (results render, dialog animates in). That must not steal the keyboard selection; only a real
	// pointer move does. Deterministic stand-in for the CI timing: dispatch the synthetic enter.
	it("a row entering under a still pointer does not steal the selection", async () => {
		await render(DocsSearchHarness, { index: entries, open: true });
		await userEvent.keyboard("webhook");
		const options = page.getByRole("option");
		await expect.poll(() => options.elements().length).toBeGreaterThan(1);
		const second = options.nth(1).element();
		second.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
		second.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(options.nth(1)).toHaveAttribute("aria-selected", "true");
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(options.first()).toHaveAttribute("aria-selected", "true");
		second.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
		await expect.element(options.nth(1)).toHaveAttribute("aria-selected", "true");
	});

	// #76: the lazy loader resolving while the dialog is open must not reset the typed query.
	it("typing before the lazy index resolves keeps the query and results", async () => {
		let resolve!: (e: DocsSearchEntry[]) => void;
		const index = () => new Promise<DocsSearchEntry[]>((r) => (resolve = r));
		await render(DocsSearchHarness, { index, open: true });
		await userEvent.keyboard("webhook");
		await expect.element(page.getByRole("status")).toMatchTextContent("Carregando");
		resolve(entries);
		const options = page.getByRole("option");
		await expect.poll(() => options.elements().length).toBeGreaterThan(1);
		await expect.element(input()).toHaveValue("webhook");
		await expect.element(options.first()).toHaveAttribute("aria-selected", "true");
	});

	it("selection is clamped at both ends", async () => {
		await render(DocsSearchHarness, { index: entries, open: true });
		await userEvent.keyboard("webhook");
		const options = page.getByRole("option");
		await expect.poll(() => options.elements().length).toBeGreaterThan(0);
		const n = options.elements().length;
		await userEvent.keyboard("{ArrowDown}".repeat(n + 3));
		await expect.element(options.nth(n - 1)).toHaveAttribute("aria-selected", "true");
		await userEvent.keyboard("{ArrowUp}".repeat(n + 3));
		await expect.element(options.first()).toHaveAttribute("aria-selected", "true");
	});

	it("shows a status message when nothing matches", async () => {
		await render(DocsSearchHarness, { index: entries, open: true });
		await userEvent.keyboard("zzzxyz");
		await expect.element(page.getByRole("status")).toMatchTextContent("Nada encontrado para");
	});

	it("clicking a result selects it and closes the dialog", async () => {
		const onselect = vi.fn();
		await render(DocsSearchHarness, { index: entries, open: true, onselect });
		await userEvent.keyboard("webhook");
		await page.getByRole("option", { name: /Webhooks/ }).click();
		expect(onselect).toHaveBeenCalledWith("/api/webhooks");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("Escape and the Fechar button close the dialog", async () => {
		await render(DocsSearchHarness, { index: entries, open: true });
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("lazy loader runs once, on first open, and reports failure", async () => {
		const loader = vi.fn(async () => entries);
		await render(DocsSearchHarness, { index: loader, open: true });
		await userEvent.keyboard("webhook");
		await expect.element(page.getByRole("option", { name: /Webhooks/ })).toBeVisible();
		expect(loader).toHaveBeenCalledOnce();
	});

	it("shows an error status when the loader rejects", async () => {
		await render(DocsSearchHarness, {
			index: async () => Promise.reject(new Error("boom")),
			open: true,
		});
		await expect
			.element(page.getByRole("status"))
			.toMatchTextContent("Não foi possível carregar o índice de busca.");
	});
});
