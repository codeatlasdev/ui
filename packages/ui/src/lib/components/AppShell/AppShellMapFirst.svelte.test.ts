import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./AppShellMapFirst.test.svelte";

const html = document.documentElement;
const q = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const cs = (el: Element) => getComputedStyle(el);
const px = (v: string) => Number.parseFloat(v);
/** A custom property holding a length, resolved to px through a probe on the shell. */
function inset(name: string): number {
	const probe = document.createElement("div");
	probe.style.cssText = `position:absolute;visibility:hidden;width:var(${name})`;
	q(".ca-shell").appendChild(probe);
	const w = probe.getBoundingClientRect().width;
	probe.remove();
	return w;
}
/** Resolves once `.ca-main` stops moving (the panel spring settled). */
async function still(): Promise<void> {
	let last = -1;
	let n = 0;
	while (n < 20) {
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		const left = q(".ca-main").getBoundingClientRect().left;
		n = left === last ? n + 1 : 0;
		last = left;
	}
}
/** Alpha channel of a computed colour string (`rgb(...)`, `rgba(...)`, `oklch(... / a)`, `color(srgb ... / a)`). */
function alpha(color: string): number {
	const slash = color.match(/\/\s*([\d.]+%?)\s*\)/);
	if (slash) return slash[1].endsWith("%") ? px(slash[1]) / 100 : px(slash[1]);
	const rgba = color.match(/^rgba?\(([^)]+)\)$/);
	if (rgba) {
		const parts = rgba[1].split(",");
		return parts.length === 4 ? px(parts[3]) : 1;
	}
	return 1;
}

afterEach(async () => {
	html.style.removeProperty("--ca-rail-width");
	html.setAttribute("data-style", "solid");
	await page.viewport(...VIEWPORTS.desktop);
});

describe("rail width token (#680)", () => {
	it("the content offset and the stage inset follow --ca-rail-width", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		html.style.setProperty("--ca-rail-width", "80px");
		await render(Harness, { stage: true });
		await still();
		const rail = q(".ca-rail").getBoundingClientRect();
		expect(rail.width).toBe(80);
		expect(q(".ca-main").getBoundingClientRect().left).toBe(80 + 200);
		await expect.poll(() => inset("--ca-shell-inset-left")).toBe(80 + 200);
		expect(q(".ca-shell__stage").getBoundingClientRect().left).toBe(80 + 200);
	});

	it("follows a token changed after mount", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness);
		await still();
		expect(q(".ca-main").getBoundingClientRect().left).toBe(52 + 200);
		html.style.setProperty("--ca-rail-width", "72px");
		await expect.poll(() => q(".ca-main").getBoundingClientRect().left).toBe(72 + 200);
		await expect.poll(() => inset("--ca-shell-inset-left")).toBe(72 + 200);
	});

	it("railWidth sets the token on the shell and moves everything with it", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { railWidth: 80 });
		await still();
		expect(q(".ca-rail").getBoundingClientRect().width).toBe(80);
		expect(q(".ca-main").getBoundingClientRect().left).toBe(80 + 200);
		await expect.poll(() => inset("--ca-shell-inset-left")).toBe(80 + 200);
	});

	it("keeps 52px by default", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness);
		await still();
		expect(q(".ca-rail").getBoundingClientRect().width).toBe(52);
		expect(q(".ca-main").getBoundingClientRect().left).toBe(52 + 200);
	});
});

describe("mobileHeader (#680)", () => {
	it("mobileHeader={false}: no header, no reserved space, inset-top is 0", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { mobileHeader: false, stage: true });
		expect(q(".ca-mobile-header")).toBeNull();
		expect(inset("--ca-shell-inset-top")).toBe(0);
		expect(q('[data-testid="stage"]').getBoundingClientRect().top).toBe(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps the header and its inset by default", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness, { stage: true });
		const header = q(".ca-mobile-header").getBoundingClientRect();
		expect(header.height).toBeGreaterThan(40);
		expect(inset("--ca-shell-inset-top")).toBeCloseTo(header.height, 0);
	});
});

describe("rail item tokens (#680)", () => {
	it("--ca-rail-item-h, --ca-rail-icon and the pip tokens drive the metrics", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const root = (await render(Harness)).container;
		const host = q(".ca-shell");
		host.style.setProperty("--ca-rail-item-h", "56px");
		host.style.setProperty("--ca-rail-icon", "24px");
		host.style.setProperty("--ca-rail-pip-w", "6px");
		host.style.setProperty("--ca-rail-pip-h", "28px");
		await settled();
		const btn = q(".ca-rail__icon");
		expect(btn.getBoundingClientRect().height).toBe(56);
		const svg = btn.querySelector("svg") as SVGElement;
		expect(svg.getBoundingClientRect().width).toBe(24);
		const pip = q(".ca-rail__pip").getBoundingClientRect();
		expect([pip.width, pip.height]).toEqual([6, 28]);
		expect(root).toBeTruthy();
	});

	it("defaults stay 40px, 18px, 4x16", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness);
		expect(q(".ca-rail__icon").getBoundingClientRect().height).toBe(40);
		expect((q(".ca-rail__icon svg") as unknown as SVGElement).getBoundingClientRect().width).toBe(
			18
		);
		const pip = q(".ca-rail__pip").getBoundingClientRect();
		expect([pip.width, pip.height]).toEqual([4, 16]);
	});

	it("railSeparators={false} drops the separators, true keeps them", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { withBottom: true });
		expect(document.querySelectorAll(".ca-rail__sep, .ca-rail__bottom-sep").length).toBe(2);
		await screen.rerender({ withBottom: true, railSeparators: false });
		expect(document.querySelectorAll(".ca-rail__sep, .ca-rail__bottom-sep").length).toBe(0);
	});
});

describe("PageFrame spacing tokens (#680)", () => {
	it("--ca-frame-pad-x / --ca-frame-pad-y set the inline and block padding of every part", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { frame: true });
		q(".ca-page-frame").style.setProperty("--ca-frame-pad-x", "16px");
		q(".ca-page-frame").style.setProperty("--ca-frame-pad-y", "10px");
		await settled();
		for (const sel of [
			".ca-page-frame__header",
			".ca-page-frame__toolbar",
			".ca-page-frame__body",
			".ca-page-frame__footer",
		]) {
			const s = cs(q(sel));
			expect([sel, s.paddingLeft, s.paddingRight]).toEqual([sel, "16px", "16px"]);
		}
		expect(cs(q(".ca-page-frame__header")).paddingTop).toBe("10px");
		expect(cs(q(".ca-page-frame__header")).paddingBottom).toBe("10px");
		expect(cs(q(".ca-page-frame__footer")).paddingTop).toBe("10px");
	});

	it("defaults keep 20px inline padding", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { frame: true });
		for (const sel of [
			".ca-page-frame__header",
			".ca-page-frame__toolbar",
			".ca-page-frame__body",
			".ca-page-frame__footer",
		])
			expect(cs(q(sel)).paddingLeft).toBe("20px");
		expect(cs(q(".ca-page-frame__header")).paddingTop).toBe("16px");
		expect(cs(q(".ca-page-frame__header")).paddingBottom).toBe("12px");
	});

	it("--ca-frame-border-width sets the header and footer separators", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { frame: true, headerBorder: true });
		const frame = q(".ca-page-frame");
		frame.style.setProperty("--ca-frame-border-width", "3px");
		await settled();
		expect(cs(q(".ca-page-frame__header")).boxShadow).toContain("3px");
		expect(cs(q(".ca-page-frame__footer")).boxShadow).toContain("3px");
	});
});

describe('data-style="solid" materials (#680)', () => {
	it("rail, panel and PageFrame resolve to opaque fills with no token re-declared", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		html.setAttribute("data-style", "solid");
		await render(Harness, { frame: true });
		for (const sel of [".ca-rail", ".ca-panel", ".ca-page-frame__panel"]) {
			const bg = cs(q(sel)).backgroundColor;
			expect([sel, alpha(bg)]).toEqual([sel, 1]);
		}
		html.classList.add("dark");
		for (const sel of [".ca-rail", ".ca-panel", ".ca-page-frame__panel"]) {
			const bg = cs(q(sel)).backgroundColor;
			expect([sel, alpha(bg)]).toEqual([sel, 1]);
		}
		html.classList.remove("dark");
	});

	it("glass stays translucent", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		html.setAttribute("data-style", "glass");
		await render(Harness, { frame: true });
		expect(alpha(cs(q(".ca-rail")).backgroundColor)).toBeLessThan(1);
	});
});

describe("NavModule badgeTone (#680)", () => {
	it("error and brand tones paint different fills, default is brand", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		const fills = [...document.querySelectorAll(".ca-rail .ca-nav-module-badge")].map(
			(b) => cs(b).backgroundColor
		);
		const tones = [...document.querySelectorAll(".ca-rail .ca-nav-module-badge")].map((b) =>
			b.getAttribute("data-tone")
		);
		expect(tones).toEqual(["error", "brand", null]);
		expect(fills[0]).not.toBe(fills[1]);
		expect(fills[1]).toBe(fills[2]);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the bottom nav tab uses the same tone", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness);
		const tones = [...document.querySelectorAll(".ca-bottom-nav .ca-nav-module-badge")].map((b) =>
			b.getAttribute("data-tone")
		);
		expect(tones).toEqual(["error", "brand", null]);
	});
});
