import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import { settled } from "../../../../tests/settled";
import { touchTarget } from "../../../../tests/touch-target";
import { VIEWPORTS } from "../../../../tests/viewports";
import Host from "./PageShellPriority.test.svelte";

const rect = (el: Element) => el.getBoundingClientRect();
const visible = (el: Element) => {
	const r = rect(el);
	return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== "none";
};
/** The labelled buttons that are laid out inside the actions block (the More trigger excluded). */
const shown = (c: HTMLElement) =>
	[...q(c, ".ca-page-shell__actions").querySelectorAll<HTMLElement>("button")]
		.filter((el) => visible(el) && el.getAttribute("aria-label") !== "More")
		.map((el) => el.textContent?.trim());

describe("PageShell header: action priority (#918)", () => {
	afterEach(async () => {
		await page.viewport(...VIEWPORTS.desktop);
	});

	it("360px: the title keeps a 12rem column and the actions take their own row", async () => {
		await page.viewport(360, 780);
		const screen = await render(Host, {});
		await settled();
		const meta = q(screen.container, ".ca-page-shell__meta");
		const actions = q(screen.container, ".ca-page-shell__actions");
		const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
		expect(rect(meta).width).toBeGreaterThanOrEqual(12 * rem - 0.5);
		// A second row: the actions start below the title block, not beside it.
		expect(rect(actions).top).toBeGreaterThanOrEqual(rect(meta).bottom - 1);
		// The title reads in at most two lines.
		const h1 = q(screen.container, "h1");
		const line = parseFloat(getComputedStyle(h1).lineHeight);
		expect(rect(h1).height).toBeLessThanOrEqual(line * 2 + 1);
	});

	it("1000px: wide actions keep the title column at 12rem", async () => {
		await page.viewport(1000, 780);
		const screen = await render(Host, { primary: false, manyActions: true });
		await settled();
		const meta = q(screen.container, ".ca-page-shell__meta");
		const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
		expect(rect(meta).width).toBeGreaterThanOrEqual(12 * rem - 0.5);
	});

	it("360px: the primary action stays, the others move into a More menu", async () => {
		await page.viewport(360, 780);
		const screen = await render(Host, { width: "200px" });
		await settled();
		await expect.element(screen.getByRole("button", { name: "More" })).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Novo" })).toBeVisible();
		expect(shown(screen.container)).toEqual(["Novo"]);
	});

	it("a pick in the More menu runs the real action, in row order", async () => {
		await page.viewport(360, 780);
		const clicked: string[] = [];
		const screen = await render(Host, { clicked, width: "200px" });
		await screen.getByRole("button", { name: "More" }).click();
		const items = page.getByRole("menuitem");
		await expect.element(items.first()).toBeVisible();
		expect(items.elements().map((el) => el.textContent?.trim())).toEqual(["Exportar", "Importar"]);
		await page.getByRole("menuitem", { name: "Importar" }).click();
		expect(clicked).toEqual(["import"]);
	});

	it("the More trigger is a touch-sized icon button named More", async () => {
		await page.viewport(360, 780);
		const screen = await render(Host, { width: "200px" });
		const more = screen.getByRole("button", { name: "More" });
		await expect.element(more).toBeVisible();
		if (matchMedia("(pointer: coarse)").matches)
			expect(rect(more.element()).height).toBeGreaterThanOrEqual(touchTarget());
		expect(more.element().classList.contains("ca-icon-btn")).toBe(true);
	});

	it("keyboard: Enter on More opens the menu, Escape returns focus to it", async () => {
		await page.viewport(360, 780);
		const screen = await render(Host, { width: "200px" });
		const more = screen.getByRole("button", { name: "More" });
		await expect.element(more).toBeVisible();
		(more.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("menuitem").first()).toHaveFocus();
		await userEvent.keyboard("{Escape}");
		await expect.element(more).toHaveFocus();
	});

	it("no data-priority anywhere: nothing collapses (existing behaviour)", async () => {
		await page.viewport(360, 780);
		const screen = await render(Host, { primary: false });
		await settled();
		expect(screen.getByRole("button", { name: "More" }).elements()).toHaveLength(0);
		expect(shown(screen.container)).toEqual(["Exportar", "Importar", "Novo"]);
	});

	it("1280px: the actions sit on the title's row and nothing collapses", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Host, {});
		await settled();
		const meta = q(screen.container, ".ca-page-shell__meta");
		const actions = q(screen.container, ".ca-page-shell__actions");
		expect(screen.getByRole("button", { name: "More" }).elements()).toHaveLength(0);
		expect(shown(screen.container)).toEqual(["Exportar", "Importar", "Novo"]);
		expect(rect(actions).left).toBeGreaterThanOrEqual(rect(meta).right - 1);
		expect(rect(actions).top).toBeLessThan(rect(meta).bottom);
	});

	it("a wider shell brings the actions back, a narrower one moves them again", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Host, { width: "300px" });
		await settled();
		await expect.poll(() => shown(screen.container)).toEqual(["Novo"]);
		(screen.container.querySelector('[data-testid="host"]') as HTMLElement).style.width = "100vw";
		await expect.poll(() => shown(screen.container)).toEqual(["Exportar", "Importar", "Novo"]);
		expect(screen.getByRole("button", { name: "More" }).elements()).toHaveLength(0);
	});

	it("passes axe closed and open", async () => {
		await page.viewport(360, 780);
		const screen = await render(Host, { width: "200px" });
		const more = screen.getByRole("button", { name: "More" });
		await expect.element(more).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await more.click();
		await settled();
		expect(
			await checkA11y(document.querySelector('[role="menu"]') as HTMLElement)
		).toHaveNoViolations();
	});
});
