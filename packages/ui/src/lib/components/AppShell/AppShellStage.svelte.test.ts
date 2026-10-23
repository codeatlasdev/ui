import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./AppShellStage.test.svelte";

const q = (sel: string) => document.querySelector(sel);
const box = (sel: string) => (q(sel) as HTMLElement).getBoundingClientRect();
/** A custom property holding a length: resolved through a probe element so `calc()` becomes px. */
function inset(name: string): number {
	const probe = document.createElement("div");
	probe.style.cssText = `position:absolute;visibility:hidden;width:var(${name})`;
	(q(".ca-shell") as HTMLElement).appendChild(probe);
	const px = probe.getBoundingClientRect().width;
	probe.remove();
	return px;
}
const shown = (el: HTMLElement) => el.checkVisibility({ visibilityProperty: true });

describe("AppShellLayout stage (#343)", () => {
	it("mounts the stage once across three navigations", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		const { component } = screen as unknown as {
			component: { go: (p: string) => void; getStats: () => { mounts: number; destroys: number } };
		};
		await expect.element(page.getByTestId("stage")).toBeInTheDocument();
		for (const p of ["/app/b", "/app/c", "/app/a"]) {
			component.go(p);
			await expect.element(page.getByRole("heading", { name: p })).toBeVisible();
		}
		expect(component.getStats()).toMatchObject({ mounts: 1, destroys: 0 });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("lets clicks on empty content reach the stage, but not on a panel", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		const { component } = screen as unknown as {
			component: { getStats: () => { clicks: number } };
		};
		const stage = box('[data-testid="stage"]');
		const hit = (x: number, y: number) => document.elementFromPoint(x, y);
		// empty area, bottom right of the stage
		expect(hit(stage.right - 10, stage.bottom - 10)).toBe(q('[data-testid="stage"]'));
		// the panel stays interactive
		const panel = box(".ca-stage-panel");
		expect(hit(panel.left + 5, panel.top + 5)?.closest(".ca-stage-panel")).not.toBeNull();
		await page.getByTestId("stage").click({ position: { x: 300, y: 300 } });
		expect(component.getStats().clicks).toBe(1);
	});

	it("sits right of the rail and panel on desktop (--ca-shell-inset-left)", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness);
		await expect.poll(() => box(".ca-panel").width).toBeGreaterThan(190);
		const stage = box('[data-testid="stage"]');
		const main = box(".ca-main");
		expect(stage.left).toBe(main.left);
		expect(stage.bottom).toBe(main.bottom);
		await expect.poll(() => inset("--ca-shell-inset-left")).toBe(52 + 200);
		expect(inset("--ca-shell-inset-bottom")).toBe(0);
		expect(inset("--ca-shell-inset-top")).toBe(0);
	});

	it("stops above the bottom nav and under the mobile header at 390px", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness);
		const stage = box('[data-testid="stage"]');
		const nav = box(".ca-bottom-nav");
		const header = box(".ca-mobile-header");
		expect(stage.bottom).toBeLessThanOrEqual(nav.top + 0.5);
		expect(stage.top).toBeGreaterThanOrEqual(header.bottom - 0.5);
		expect(stage.left).toBe(0);
		expect(stage.width).toBe(390);
		expect(inset("--ca-shell-inset-left")).toBe(0);
		expect(inset("--ca-shell-inset-bottom")).toBeCloseTo(nav.height, 0);
		expect(inset("--ca-shell-inset-top")).toBeCloseTo(header.height, 0);
	});

	it("hides and pauses the stage with stageVisible=false", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { stageVisible: false });
		const { component } = screen as unknown as {
			component: { getStats: () => { mounts: number; hidden: boolean } };
		};
		const wrap = q(".ca-shell__stage") as HTMLElement;
		expect(shown(wrap)).toBe(false);
		expect(wrap.hasAttribute("inert")).toBe(true);
		// hidden, never unmounted: the GPU context survives
		expect(component.getStats()).toMatchObject({ mounts: 1, hidden: true });
		await screen.rerender({ stageVisible: true });
		expect(shown(wrap)).toBe(true);
		expect(component.getStats().hidden).toBe(false);
	});

	it("hides when a page sets data-ca-stage=hidden on <html>", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		const { component } = screen as unknown as {
			component: { getStats: () => { hidden: boolean } };
		};
		document.documentElement.setAttribute("data-ca-stage", "hidden");
		try {
			await expect.poll(() => shown(q(".ca-shell__stage") as HTMLElement)).toBe(false);
			expect(component.getStats().hidden).toBe(true);
		} finally {
			document.documentElement.removeAttribute("data-ca-stage");
		}
		await expect.poll(() => component.getStats().hidden).toBe(false);
	});

	it("without a stage the content region is unchanged and takes pointer events", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { stage: false });
		expect(q(".ca-shell__stage")).toBeNull();
		expect(getComputedStyle(q(".ca-shell__content") as HTMLElement).pointerEvents).toBe("auto");
	});
});
