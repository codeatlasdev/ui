import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import { setLocale } from "../../i18n/index.js";
import DocsHarness from "./DocsHarness.test.svelte";

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("DocsShell", () => {
	it("renders header, section nav, sidebar and page index landmarks; passes axe", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(DocsHarness, { kind: "shell" });
		await expect.element(screen.getByRole("banner")).toBeVisible();
		await expect
			.element(screen.getByRole("link", { name: "Atlas Docs" }))
			.toHaveAttribute("href", "/");
		await expect.element(screen.getByRole("navigation", { name: "Seções" })).toBeVisible();
		await expect.element(screen.getByRole("navigation", { name: "Guia" })).toBeVisible();
		await expect.element(screen.getByRole("complementary", { name: "Nesta página" })).toBeVisible();
		await expect
			.element(screen.getByRole("link", { name: "Ir para o conteúdo" }))
			.toHaveAttribute("href", "#main");
		await expect
			.poll(() => document.getAnimations().filter((a) => a.playState === "running").length)
			.toBe(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("marks the active section and current page with aria-current", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(DocsHarness, { kind: "shell" });
		await expect
			.element(screen.getByRole("link", { name: "Guia", exact: true }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(screen.getByRole("link", { name: "API", exact: true }))
			.not.toHaveAttribute("aria-current");
		await expect
			.element(screen.getByRole("link", { name: "Primeiros passos" }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(screen.getByRole("link", { name: "Configuração" }))
			.not.toHaveAttribute("aria-current");
	});

	it.each([
		["Ctrl+K", "{Control>}k{/Control}"],
		["/", "/"],
	])("%s opens the search dialog", async (_label, keys) => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(DocsHarness, { kind: "shell" });
		await userEvent.keyboard(keys);
		await expect
			.element(page.getByRole("dialog", { name: "Buscar na documentação" }))
			.toBeVisible();
		await expect.element(page.getByRole("combobox", { name: "Buscar" })).toHaveFocus();
	});

	it("'/' typed inside an input does not open search", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(DocsHarness, { kind: "shell" });
		const input = document.createElement("input");
		screen.container.appendChild(input);
		input.focus();
		await userEvent.keyboard("/");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		input.remove();
	});

	it("search button opens the dialog, Escape closes it and returns focus", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(DocsHarness, { kind: "shell" });
		const btn = screen.getByRole("button", { name: /Buscar na documentação/ });
		await btn.click();
		await expect.element(page.getByRole("dialog")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect.element(btn).toHaveFocus();
	});

	it("selecting a search result calls onnavigate with its href", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const onnavigate = vi.fn();
		const screen = await render(DocsHarness, { kind: "shell", onnavigate });
		await screen.getByRole("button", { name: /Buscar na documentação/ }).click();
		await userEvent.keyboard("webhook");
		await userEvent.keyboard("{Enter}");
		expect(onnavigate).toHaveBeenCalledWith("/api/mensagens");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("on phones the menu button opens a Sheet with navigation and closes on link click", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(DocsHarness, { kind: "shell" });
		await screen.getByRole("button", { name: "Abrir navegação" }).click();
		const sheet = page.getByRole("dialog", { name: "Navegação" });
		await expect.element(sheet).toBeVisible();
		await expect
			.poll(() => document.getAnimations().filter((a) => a.playState === "running").length)
			.toBe(0);
		expect(
			await checkA11y(document.querySelector('[role="dialog"]') as HTMLElement)
		).toHaveNoViolations();
		const link = sheet.getByRole("link", { name: "Configuração" });
		await expect.element(link).toBeVisible();
		(link.element() as HTMLElement).addEventListener("click", (e) => e.preventDefault());
		await link.click();
		await expect.element(page.getByRole("dialog", { name: "Navegação" })).not.toBeInTheDocument();
	});

	it("brandLabel overrides the brand link's accessible name", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(DocsHarness, { kind: "shell", brandLabel: "Atlas Docs — início" });
		await expect
			.element(screen.getByRole("link", { name: "Atlas Docs — início" }))
			.toHaveAttribute("href", "/");
	});
});
