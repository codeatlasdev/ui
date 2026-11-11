import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import CenteredPageHarness from "./CenteredPage.test.svelte";

const rem = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
const root = document.documentElement;
const mainOf = (c: HTMLElement) => c.querySelector(".ca-centered") as HTMLElement;
const columnOf = (c: HTMLElement) => c.querySelector(".ca-centered__column") as HTMLElement;

afterEach(() => {
	root.style.removeProperty("--ca-safe-top");
	root.style.removeProperty("--ca-safe-right");
	root.style.removeProperty("--ca-safe-bottom");
	root.style.removeProperty("--ca-safe-left");
});

describe("CenteredPage a11y (#747)", () => {
	it("default: one main#main, one skip link, no violations", async () => {
		const screen = await render(CenteredPageHarness);
		expect(document.querySelectorAll("main").length).toBe(1);
		expect(document.querySelectorAll("#main").length).toBe(1);
		expect(document.querySelectorAll("a.ca-skip-link").length).toBe(1);
		expect(await checkA11y(document.body)).toHaveNoViolations();
		expect(screen.container.querySelector("main")?.getAttribute("tabindex")).toBe("-1");
	});

	it("with a brand: no violations", async () => {
		await render(CenteredPageHarness, { brand: true, brandLabel: "Acme home" });
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("mainId=null inside the page's own main: no violations", async () => {
		await render(CenteredPageHarness, { mainId: null, wrapped: true });
		expect(document.querySelectorAll("main").length).toBe(1);
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("surface=mesh: no violations", async () => {
		await render(CenteredPageHarness, { surface: "mesh" });
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("taller than the viewport: no violations", async () => {
		await render(CenteredPageHarness, { tall: true });
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("skip link moves focus to the main landmark", async () => {
		await render(CenteredPageHarness);
		await userEvent.tab();
		expect(document.activeElement?.className).toContain("ca-skip-link");
		await userEvent.keyboard("{Enter}");
		expect(document.activeElement?.tagName).toBe("MAIN");
		expect(document.activeElement?.id).toBe("main");
	});
});

describe("CenteredPage API (#747)", () => {
	it("draws no brand unless the snippet is given", async () => {
		const screen = await render(CenteredPageHarness);
		expect(screen.container.querySelector(".ca-centered__brand")).toBeNull();
		const withBrand = await render(CenteredPageHarness, { brand: true });
		const link = withBrand.container.querySelector(".ca-centered__brand") as HTMLAnchorElement;
		expect(link.textContent).toContain("Logo");
		expect(link.getAttribute("href")).toBe("/");
	});

	it("brandHref and brandLabel reach the link", async () => {
		const screen = await render(CenteredPageHarness, {
			brand: true,
			brandHref: "/home",
			brandLabel: "Acme home",
		});
		const link = screen.container.querySelector(".ca-centered__brand") as HTMLAnchorElement;
		expect(link.getAttribute("href")).toBe("/home");
		expect(link.getAttribute("aria-label")).toBe("Acme home");
	});

	it("maxWidth caps the column: sm, md default, lg and a CSS length", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const col = async (maxWidth?: string) => {
			const s = await render(CenteredPageHarness, maxWidth ? { maxWidth } : {});
			const w = columnOf(s.container).getBoundingClientRect().width;
			s.unmount();
			return w;
		};
		expect(await col()).toBeCloseTo(28 * rem(), 0);
		expect(await col("sm")).toBeCloseTo(24 * rem(), 0);
		expect(await col("lg")).toBeCloseTo(36 * rem(), 0);
		expect(await col("20rem")).toBeCloseTo(20 * rem(), 0);
	});

	it("mainId=null renders a plain div: no main, no id, no skip link", async () => {
		const screen = await render(CenteredPageHarness, { mainId: null });
		expect(document.querySelector("main")).toBeNull();
		const root = screen.container.querySelector(".ca-centered") as HTMLElement;
		expect(root.tagName).toBe("DIV");
		expect(root.hasAttribute("id")).toBe(false);
		expect(root.hasAttribute("tabindex")).toBe(false);
		expect(document.querySelector("a.ca-skip-link")).toBeNull();
	});

	it("a custom mainId is the skip link target", async () => {
		const screen = await render(CenteredPageHarness, { mainId: "content" });
		expect(mainOf(screen.container).id).toBe("content");
		expect(document.querySelector("a.ca-skip-link")?.getAttribute("href")).toBe("#content");
	});
});

describe("CenteredPage layout (#747)", () => {
	it("desktop: page height is the viewport and the column is centred both ways", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(CenteredPageHarness);
		const main = mainOf(screen.container).getBoundingClientRect();
		expect(main.height).toBeGreaterThanOrEqual(window.innerHeight - 1);
		const r = columnOf(screen.container).getBoundingClientRect();
		expect(Math.abs(r.left + r.width / 2 - window.innerWidth / 2)).toBeLessThan(2);
		expect(Math.abs(r.top + r.height / 2 - window.innerHeight / 2)).toBeLessThan(2);
	});

	it("mobile 390x844 with a notch: card clear of the insets, no sideways scroll", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		root.style.setProperty("--ca-safe-top", "47px");
		root.style.setProperty("--ca-safe-bottom", "34px");
		const screen = await render(CenteredPageHarness, { brand: true });
		const main = mainOf(screen.container);
		const cs = getComputedStyle(main);
		expect(Number.parseFloat(cs.paddingTop)).toBe(47);
		expect(Number.parseFloat(cs.paddingBottom)).toBe(34);
		const r = columnOf(screen.container).getBoundingClientRect();
		expect(r.top).toBeGreaterThanOrEqual(47);
		expect(r.bottom).toBeLessThanOrEqual(window.innerHeight - 34);
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
	});

	it("mobile 360x640: column is the viewport minus the side padding", async () => {
		await page.viewport(360, 640);
		const screen = await render(CenteredPageHarness, { maxWidth: "lg" });
		const pad = Number.parseFloat(getComputedStyle(mainOf(screen.container)).paddingLeft);
		expect(pad).toBeGreaterThanOrEqual(20);
		const r = columnOf(screen.container).getBoundingClientRect();
		expect(r.width).toBeCloseTo(window.innerWidth - 2 * pad, 0);
		expect(r.left).toBeGreaterThanOrEqual(pad - 0.5);
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
	});

	it("side insets larger than the base padding win (landscape notch)", async () => {
		await page.viewport(844, 390);
		root.style.setProperty("--ca-safe-left", "47px");
		root.style.setProperty("--ca-safe-right", "47px");
		const screen = await render(CenteredPageHarness);
		const cs = getComputedStyle(mainOf(screen.container));
		expect(Number.parseFloat(cs.paddingLeft)).toBe(47);
		expect(Number.parseFloat(cs.paddingRight)).toBe(47);
	});

	it("taller content scrolls the page and its end stays reachable", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		root.style.setProperty("--ca-safe-bottom", "34px");
		const screen = await render(CenteredPageHarness, { tall: true });
		expect(root.scrollHeight).toBeGreaterThan(window.innerHeight);
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
		const end = screen.container.querySelector("[data-end]") as HTMLElement;
		end.scrollIntoView({ block: "end" });
		expect(end.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight - 34 + 1);
	});

	it("Tab through tall content keeps the focused control in view", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(CenteredPageHarness, { tall: true });
		await userEvent.tab(); // skip link
		await userEvent.tab(); // first control
		await userEvent.tab(); // last control, below the fold
		const active = document.activeElement as HTMLElement;
		expect(active.tagName).toBe("BUTTON");
		const r = active.getBoundingClientRect();
		expect(r.top).toBeGreaterThanOrEqual(0);
		expect(r.bottom).toBeLessThanOrEqual(window.innerHeight);
	});
});
