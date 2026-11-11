import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
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
		await expect.element(screen.getByRole("navigation", { name: "Guide" })).toBeVisible();
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
			.element(screen.getByRole("link", { name: "Guide", exact: true }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(screen.getByRole("link", { name: "API", exact: true }))
			.not.toHaveAttribute("aria-current");
		await expect
			.element(screen.getByRole("link", { name: "Getting started" }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(screen.getByRole("link", { name: "Configuration" }))
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
		expect(onnavigate).toHaveBeenCalledWith("/api/messages");
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
		const link = sheet.getByRole("link", { name: "Configuration" });
		await expect.element(link).toBeVisible();
		(link.element() as HTMLElement).addEventListener("click", (e) => e.preventDefault());
		await link.click();
		await expect.element(page.getByRole("dialog", { name: "Navegação" })).not.toBeInTheDocument();
	});

	it("brandLabel overrides the brand link's accessible name", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(DocsHarness, { kind: "shell", brandLabel: "Atlas Docs home" });
		await expect
			.element(screen.getByRole("link", { name: "Atlas Docs home" }))
			.toHaveAttribute("href", "/");
	});
});

describe("DocsHeader", () => {
	it("renders the bar alone: brand, sections, search, theme; no main; passes axe", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(DocsHarness, { kind: "header" });
		await expect.element(screen.getByRole("banner")).toBeVisible();
		await expect
			.element(screen.getByRole("link", { name: "Atlas Docs" }))
			.toHaveAttribute("href", "/");
		await expect
			.element(screen.getByRole("link", { name: "Guide", exact: true }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(screen.getByRole("button", { name: /Buscar na documentação/ }))
			.toBeVisible();
		expect(document.querySelector("main")).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("is opaque: the background has no alpha, so content never shows through", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(DocsHarness, { kind: "header" });
		const header = document.querySelector(".ca-docs-header") as HTMLElement;
		const style = getComputedStyle(header);
		expect(style.backgroundColor).not.toMatch(/rgba|\/ /);
		expect(style.backdropFilter === "none" || style.backdropFilter === "").toBe(true);
	});

	it("Ctrl+K opens search from the standalone bar", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(DocsHarness, { kind: "header" });
		await userEvent.keyboard("{Control>}k{/Control}");
		await expect
			.element(page.getByRole("dialog", { name: "Buscar na documentação" }))
			.toBeVisible();
	});

	it("on phones the menu button opens the section switcher in a Sheet", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(DocsHarness, { kind: "header" });
		await screen.getByRole("button", { name: "Abrir navegação" }).click();
		const sheet = page.getByRole("dialog", { name: "Navegação" });
		await expect.element(sheet).toBeVisible();
		await expect.element(sheet.getByRole("link", { name: "API", exact: true })).toBeVisible();
	});
});

// A docs site that reloads on every page (static MPA) must not throw the reader back to the top
// of the sidebar: the position survives the load and the current page is always in view.
describe("DocsShell sidebar position", () => {
	const groups = [
		{
			label: "Reference",
			items: Array.from({ length: 60 }, (_, i) => ({ href: `/guide/p${i}`, title: `Page ${i}` })),
		},
	];
	const sidebar = () => document.querySelector(".ca-docs-sidebar") as HTMLElement;
	const inSidebarView = (el: Element) => {
		const s = sidebar().getBoundingClientRect();
		const r = el.getBoundingClientRect();
		return r.top >= s.top && r.bottom <= s.bottom;
	};

	afterEach(() => sessionStorage.clear());

	it("brings the current page into view without scrolling the window", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(DocsHarness, { kind: "shell", groups, pathname: "/guide/p59" });
		const link = screen.getByRole("link", { name: "Page 59" }).element();
		expect(sidebar().scrollHeight).toBeGreaterThan(sidebar().clientHeight);
		await expect.poll(() => inSidebarView(link)).toBe(true);
		expect(window.scrollY).toBe(0);
	});

	it("restores the sidebar scroll after following a sidebar link", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const first = await render(DocsHarness, { kind: "shell", groups, pathname: "/guide/p0" });
		sidebar().scrollTop = 900;
		const link = first.getByRole("link", { name: "Page 30" });
		(link.element() as HTMLElement).addEventListener("click", (e) => e.preventDefault());
		await link.click();
		first.unmount();
		const next = await render(DocsHarness, { kind: "shell", groups, pathname: "/guide/p30" });
		await expect.poll(() => sidebar().scrollTop).toBe(900);
		expect(inSidebarView(next.getByRole("link", { name: "Page 30" }).element())).toBe(true);
	});
});

describe("DocsShell page surface (#743)", () => {
	// The mesh is a fixed `body::before` layer drawn by the glass and frosted styles. An opaque docs
	// header over it leaves a gradient strip with a hard edge under the nav, and nothing on a
	// reading page blurs. The shell flags <html> while mounted so the page behind it is flat.
	const meshOf = () => getComputedStyle(document.body, "::before").backgroundImage;
	const html = document.documentElement;

	afterEach(() => {
		html.removeAttribute("data-style");
		html.classList.remove("dark");
	});

	it.each(["glass", "frosted"])(
		"paints no mesh under data-style=%s while mounted, and restores it on unmount",
		async (style) => {
			await page.viewport(...VIEWPORTS.desktop);
			html.dataset.style = style;
			html.classList.add("dark");
			expect(meshOf()).not.toBe("none");
			const screen = await render(DocsHarness, { kind: "shell" });
			await expect.poll(meshOf).toBe("none");
			expect(html.hasAttribute("data-ca-reading")).toBe(true);
			screen.unmount();
			await expect.poll(() => html.hasAttribute("data-ca-reading")).toBe(false);
			expect(meshOf()).not.toBe("none");
		}
	);

	it('surface="inherit" keeps the mesh', async () => {
		await page.viewport(...VIEWPORTS.desktop);
		html.dataset.style = "glass";
		html.classList.add("dark");
		await render(DocsHarness, { kind: "shell", surface: "inherit" });
		expect(html.hasAttribute("data-ca-reading")).toBe(false);
		expect(meshOf()).not.toBe("none");
	});
});

describe("DocsShell main padding (#737)", () => {
	const main = () => document.querySelector("main.ca-docs-main") as HTMLElement;
	const pad = () => {
		const s = getComputedStyle(main());
		return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(Number.parseFloat);
	};
	const pager = { next: { href: "/n", title: "Next" } };

	it("keeps today's gutter by default; tokens on an ancestor change it", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(DocsHarness, { kind: "bleed" });
		const [pt, pr, pb, pl] = pad();
		expect(pt).toBe(32);
		expect(pb).toBe(64);
		expect(pr).toBeGreaterThan(0);
		expect(pl).toBe(pr);
		const root = document.documentElement.style;
		root.setProperty("--ca-docs-main-pt", "4px");
		root.setProperty("--ca-docs-main-pb", "6px");
		root.setProperty("--ca-docs-main-px", "10px");
		try {
			expect(pad()).toEqual([4, 10, 6, 10]);
		} finally {
			for (const t of ["pt", "pb", "px"]) root.removeProperty(`--ca-docs-main-${t}`);
		}
	});

	it.each(Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[])(
		'padding="none" is 0 at %s',
		async (name: keyof typeof VIEWPORTS) => {
			const [w, h] = VIEWPORTS[name];
			await page.viewport(w, h);
			const screen = await render(DocsHarness, { kind: "bleed", padding: "none" });
			expect(pad()).toEqual([0, 0, 0, 0]);
			expect(main().id).toBe("main");
			expect(document.querySelectorAll("main")).toHaveLength(1);
			await expect
				.element(screen.getByRole("link", { name: "Ir para o conteúdo" }))
				.toHaveAttribute("href", "#main");
		}
	);

	it('padding="x" and "y" remove one axis only', async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const x = await render(DocsHarness, { kind: "bleed", padding: "x" });
		const [pt, pr, pb, pl] = pad();
		expect([pt, pb]).toEqual([32, 64]);
		expect([pr, pl]).toEqual([0, 0]);
		x.unmount();
		await render(DocsHarness, { kind: "bleed", padding: "y" });
		const [t2, r2, b2, l2] = pad();
		expect([t2, b2]).toEqual([0, 0]);
		expect(r2).toBeGreaterThan(0);
		expect(l2).toBe(r2);
	});

	it("a data-ca-bleed child spans the main box edge to edge, with no negative margin", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(DocsHarness, { kind: "bleed" });
		const hero = screen.getByTestId("hero").element() as HTMLElement;
		const m = main().getBoundingClientRect();
		const h = hero.getBoundingClientRect();
		expect(h.left).toBeCloseTo(m.left, 1);
		expect(h.right).toBeCloseTo(m.right, 1);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	});

	it("padding=none keeps the pager clearance on narrow screens", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(DocsHarness, { kind: "bleed", padding: "none", pager });
		const [, , pb] = pad();
		expect(pb).toBeGreaterThanOrEqual(touchTarget());
		const bar = document.querySelector(".ca-docs-pager") as HTMLElement;
		const last = screen.getByTestId("last").element() as HTMLElement;
		expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			bar.getBoundingClientRect().top
		);
	});

	it("passes axe with padding=none", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(DocsHarness, { kind: "bleed", padding: "none" });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
