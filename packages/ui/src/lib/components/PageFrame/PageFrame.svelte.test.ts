import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import { stageInsets } from "../../stores/stage-insets.svelte.js";
import Harness from "./PageFrameHarness.test.svelte";
import ShellHarness from "./PageFrameInShell.test.svelte";

const html = document.documentElement;
const q = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const panel = () => q(".ca-page-frame__panel");
const rect = (el: Element) => el.getBoundingClientRect();

async function mount(
	props: Record<string, unknown> = {},
	viewport: readonly [number, number] = VIEWPORTS.desktop
) {
	await page.viewport(...viewport);
	const screen = await render(Harness, props);
	await settled();
	return screen;
}

afterEach(async () => {
	stageInsets.reset();
	html.removeAttribute("data-ca-stage");
	await page.viewport(...VIEWPORTS.desktop);
});

describe("PageFrame map mode (desktop)", () => {
	it("floats a panel of the requested width on the chosen side", async () => {
		await mount({ mode: "map", side: "left", width: "md" });
		expect(Math.round(rect(panel()).width)).toBe(416);
		expect(Math.round(rect(panel()).left)).toBeLessThan(40);
	});

	it("side=right puts the panel against the right edge", async () => {
		await mount({ mode: "map", side: "right", width: "sm" });
		expect(Math.round(rect(panel()).width)).toBe(352);
		expect(window.innerWidth - rect(panel()).right).toBeLessThan(40);
	});

	it("the stage around the panel stays interactive", async () => {
		const screen = await mount({ mode: "map", side: "left", width: "sm" });
		let taps = 0;
		q("[data-testid=stage]").addEventListener("click", () => taps++);
		// Right of the 352px panel: the frame must not swallow pointer events there.
		const el = document.elementFromPoint(window.innerWidth - 40, window.innerHeight / 2);
		expect(el).toBe(q("[data-testid=stage]"));
		expect(taps).toBe(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("publishes the covered rect, following side and width", async () => {
		const screen = await mount({ mode: "map", side: "left", width: "md" });
		await expect.poll(() => stageInsets.current.left).toBeGreaterThanOrEqual(416);
		expect(stageInsets.current.right).toBe(0);
		expect(html.style.getPropertyValue("--ca-stage-inset-left")).toBe(
			`${stageInsets.current.left}px`
		);
		await screen.rerender({ mode: "map", side: "right", width: "lg" });
		await settled();
		await expect.poll(() => stageInsets.current.right).toBeGreaterThanOrEqual(544);
		expect(stageInsets.current.left).toBe(0);
	});

	it("clears the insets when the frame unmounts", async () => {
		const screen = await mount({ mode: "map", side: "left", width: "md" });
		await expect.poll(() => stageInsets.current.left).toBeGreaterThan(0);
		screen.unmount();
		expect(stageInsets.current).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
		expect(html.style.getPropertyValue("--ca-stage-inset-left")).toBe("");
	});
});

describe("PageFrame split and page modes", () => {
	it("split gives the work area about 60% and leaves a stage strip", async () => {
		await mount({ mode: "split", side: "left" });
		const ratio = rect(panel()).width / window.innerWidth;
		expect(ratio).toBeGreaterThan(0.55);
		expect(ratio).toBeLessThan(0.65);
		await expect.poll(() => stageInsets.current.left).toBeGreaterThan(window.innerWidth * 0.55);
	});

	it("page is an opaque full page and hides the stage", async () => {
		const screen = await mount({ mode: "page" });
		expect(Math.round(rect(panel()).width)).toBe(window.innerWidth);
		expect(html.getAttribute("data-ca-stage")).toBe("hidden");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		screen.unmount();
		expect(html.hasAttribute("data-ca-stage")).toBe(false);
	});

	it("leaving page mode shows the stage again", async () => {
		const screen = await mount({ mode: "page" });
		await screen.rerender({ mode: "map" });
		expect(html.hasAttribute("data-ca-stage")).toBe(false);
	});
});

describe("PageFrame slots", () => {
	it("header, toolbar and footer stay put while only the body scrolls", async () => {
		await mount({ mode: "map", width: "sm", withToolbar: true, withFooter: true, rows: 80 });
		const body = q(".ca-page-frame__body");
		const header = q(".ca-page-frame__header");
		const footer = q(".ca-page-frame__footer");
		const before = [rect(header).top, rect(footer).top];
		body.scrollTop = 400;
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		expect(body.scrollTop).toBeGreaterThan(0);
		expect([rect(header).top, rect(footer).top]).toEqual(before);
		expect(getComputedStyle(body).overscrollBehaviorY).toBe("contain");
		expect(rect(panel()).height).toBeLessThanOrEqual(window.innerHeight);
	});

	it("renders no wrapper for a slot that is not passed", async () => {
		await mount({ mode: "map", bare: true });
		expect(q(".ca-page-frame__header")).toBeNull();
		expect(q(".ca-page-frame__toolbar")).toBeNull();
		expect(q(".ca-page-frame__footer")).toBeNull();
		expect(q(".ca-page-frame__body")).not.toBeNull();
	});

	it("padded=false makes the body full-bleed", async () => {
		await mount({ mode: "map", padded: false });
		expect(getComputedStyle(q(".ca-page-frame__body")).paddingLeft).toBe("0px");
	});

	it("padded (default) pads the body", async () => {
		await mount({ mode: "map" });
		expect(
			Number.parseFloat(getComputedStyle(q(".ca-page-frame__body")).paddingLeft)
		).toBeGreaterThan(8);
	});

	it("headerBorder draws a separator under the header", async () => {
		await mount({ mode: "map", headerBorder: true });
		expect(q(".ca-page-frame__header").hasAttribute("data-bordered")).toBe(true);
	});
});

describe("PageFrame mobile", () => {
	it("map without sheet is full screen over the stage", async () => {
		await mount({ mode: "map" }, VIEWPORTS.mobile);
		expect(Math.round(rect(panel()).width)).toBe(VIEWPORTS.mobile[0]);
		expect(Math.round(rect(panel()).height)).toBeGreaterThan(VIEWPORTS.mobile[1] * 0.9);
	});

	it("sheet is a non-modal bottom sheet capped near 45% height", async () => {
		const screen = await mount({ mode: "map", sheet: true, rows: 80 }, VIEWPORTS.mobile);
		const h = rect(panel()).height;
		expect(h).toBeLessThanOrEqual(VIEWPORTS.mobile[1] * 0.46);
		expect(h).toBeGreaterThan(VIEWPORTS.mobile[1] * 0.2);
		expect(Math.abs(rect(panel()).bottom - window.innerHeight)).toBeLessThan(80);
		// Non-modal: not a dialog, no backdrop, no inert, the stage above takes taps.
		expect(q("dialog")).toBeNull();
		expect(q(".ca-page-frame__backdrop")).toBeNull();
		const el = document.elementFromPoint(window.innerWidth / 2, 60);
		expect(el).toBe(q("[data-testid=stage]"));
		await expect.poll(() => stageInsets.current.bottom).toBeGreaterThanOrEqual(Math.round(h) - 1);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the body scrolls inside the sheet", async () => {
		await mount({ mode: "map", sheet: true, rows: 80 }, VIEWPORTS.mobile);
		const body = q(".ca-page-frame__body");
		body.scrollTop = 300;
		expect(body.scrollTop).toBeGreaterThan(0);
	});

	it("detent peek, half and full resize the sheet and the published inset", async () => {
		const screen = await mount({ mode: "map", sheet: true, detent: "peek" }, VIEWPORTS.mobile);
		const peek = rect(panel()).height;
		await screen.rerender({ mode: "map", sheet: true, detent: "half" });
		await settled();
		const half = rect(panel()).height;
		await screen.rerender({ mode: "map", sheet: true, detent: "full" });
		await settled();
		const full = rect(panel()).height;
		expect(peek).toBeLessThan(half);
		expect(half).toBeLessThan(full);
		await expect.poll(() => stageInsets.current.bottom).toBe(Math.round(full));
	});

	it("the handle is a keyboard-operable slider that moves between detents", async () => {
		const screen = await mount({ mode: "map", sheet: true, detent: "half" }, VIEWPORTS.mobile);
		const handle = q(".ca-page-frame__handle");
		expect(handle.getAttribute("role")).toBe("slider");
		expect(handle.getAttribute("aria-valuetext")).toBeTruthy();
		handle.focus();
		const half = rect(panel()).height;
		await userEvent.keyboard("{ArrowUp}");
		await settled();
		expect(rect(panel()).height).toBeGreaterThan(half);
		await userEvent.keyboard("{Home}");
		await settled();
		expect(rect(panel()).height).toBeLessThan(half);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("dragging the handle up snaps to a taller detent", async () => {
		await mount({ mode: "map", sheet: true, detent: "half" }, VIEWPORTS.mobile);
		const handle = q(".ca-page-frame__handle");
		const half = rect(panel()).height;
		const b = rect(handle);
		const x = b.left + b.width / 2;
		const y = b.top + b.height / 2;
		handle.dispatchEvent(
			new PointerEvent("pointerdown", {
				pointerId: 1,
				isPrimary: true,
				clientX: x,
				clientY: y,
				bubbles: true,
			})
		);
		handle.dispatchEvent(
			new PointerEvent("pointermove", {
				pointerId: 1,
				isPrimary: true,
				clientX: x,
				clientY: y - 300,
				bubbles: true,
			})
		);
		handle.dispatchEvent(
			new PointerEvent("pointerup", {
				pointerId: 1,
				isPrimary: true,
				clientX: x,
				clientY: y - 300,
				bubbles: true,
			})
		);
		await settled();
		await expect.poll(() => rect(panel()).height).toBeGreaterThan(half + 50);
	});

	it("split is full screen on mobile; mobileStage shows the stage instead", async () => {
		const screen = await mount({ mode: "split" }, VIEWPORTS.mobile);
		expect(Math.round(rect(panel()).width)).toBe(VIEWPORTS.mobile[0]);
		await screen.rerender({ mode: "split", mobileStage: true });
		await settled();
		expect(panel().hasAttribute("hidden") || getComputedStyle(panel()).display === "none").toBe(
			true
		);
		expect(stageInsets.current).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
	});
});

describe("PageFrame accessibility", () => {
	it("the panel is a named region, the title a heading", async () => {
		const screen = await mount({ mode: "map" });
		expect(panel().tagName).toBe("SECTION");
		expect(panel().getAttribute("aria-label")).toBe("Lead");
		expect(q(".ca-page-frame__header h2").textContent).toBe("Territory");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("axe is clean in split with toolbar and footer", async () => {
		const screen = await mount({ mode: "split", withToolbar: true, withFooter: true });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("Tab order runs header, toolbar, body, footer", async () => {
		await mount({ mode: "map", withToolbar: true, withFooter: true, rows: 80 });
		const order: string[] = [];
		for (let i = 0; i < 3; i++) {
			await userEvent.tab();
			const el = document.activeElement as HTMLElement;
			order.push(el.getAttribute("aria-label") ?? el.textContent ?? "");
		}
		// The stage button is first in the DOM; then the toolbar field, the scrolling body, the footer button.
		expect(order.slice(1)).toEqual(["Search", "Lead"]);
	});
});

describe("PageFrame inside AppShellLayout", () => {
	it("the inset is measured from the content area, not the viewport", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(ShellHarness, { mode: "map", side: "left" });
		await settled();
		const area = q(".ca-page-frame").getBoundingClientRect();
		const p = panel().getBoundingClientRect();
		// The shell's rail and panel push the content area right; the inset is relative to it.
		expect(area.left).toBeGreaterThan(100);
		await expect.poll(() => stageInsets.current.left).toBe(Math.round(p.right - area.left));
	});

	it("map to page to map restores the insets and the stage", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(ShellHarness, { mode: "map", side: "right" });
		await settled();
		await expect.poll(() => stageInsets.current.right).toBeGreaterThan(300);
		await screen.rerender({ mode: "page", side: "right" });
		await settled();
		expect(html.getAttribute("data-ca-stage")).toBe("hidden");
		await screen.rerender({ mode: "map", side: "right" });
		await settled();
		expect(html.hasAttribute("data-ca-stage")).toBe(false);
		await expect.poll(() => stageInsets.current.right).toBeGreaterThan(300);
	});
});
