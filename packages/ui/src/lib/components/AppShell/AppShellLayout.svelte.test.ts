import { describe, expect, it, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import { reducedMotion } from "../../stores/reduced-motion.svelte";
import Harness from "./AppShellHarness.test.svelte";

const visible = (el: Element | null) => !!el?.checkVisibility();
const q = (sel: string) => document.querySelector(sel);

/** Resolves once the shell offset (inline var + painted left edge) is unchanged for `frames` frames in a row. */
async function settledOffset(main: () => HTMLElement, frames = 30): Promise<void> {
	const read = () =>
		`${main().style.getPropertyValue("--ca-main-ml")}|${main().getBoundingClientRect().left}`;
	let last = read();
	let still = 0;
	while (still < frames) {
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		const now = read();
		still = now === last ? still + 1 : 0;
		last = now;
	}
}

describe("AppShellLayout: desktop", () => {
	it("shows rail + panel, hides bottom nav and mobile header", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/app/dashboard" });

		await expect.poll(() => q(".ca-panel")).not.toBeNull();
		expect(visible(q(".ca-rail"))).toBe(true);
		expect(visible(q(".ca-panel"))).toBe(true);
		expect(visible(q(".ca-bottom-nav"))).toBe(false);
		expect(visible(q(".ca-mobile-header"))).toBe(false);

		// Rail module buttons are reachable; panel exposes the section links
		await expect.element(screen.getByRole("button", { name: "Application" })).toBeVisible();
		await expect.element(screen.getByRole("link", { name: "Dashboard" })).toBeVisible();
		await expect.element(screen.getByRole("heading", { name: "Page content" })).toBeVisible();
	});

	it("marks the active module and active panel link with aria-current", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/app/docs" });
		const rail = page.getByRole("navigation", { name: "Module navigation" }).first();
		await expect
			.element(rail.getByRole("button", { name: "Application" }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(rail.getByRole("button", { name: "Settings" }))
			.not.toHaveAttribute("aria-current");
		await expect
			.element(screen.getByRole("link", { name: "Documents 3 unread" }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(screen.getByRole("link", { name: "Dashboard" }))
			.not.toHaveAttribute("aria-current");
	});

	it("has module + section navigation landmarks", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness);
		await expect
			.element(page.getByRole("complementary", { name: "Section navigation" }))
			.toBeVisible();
		expect(
			page.getByRole("navigation", { name: "Module navigation" }).elements().length
		).toBeGreaterThanOrEqual(1);
	});

	it("rail click navigates to the module's first path", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const onNavigate = vi.fn();
		const screen = await render(Harness, { pathname: "/app/dashboard", onNavigate });
		const rail = page.getByRole("navigation", { name: "Module navigation" }).first();

		await rail.getByRole("button", { name: "Settings" }).click();
		expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/settings/general");
		await expect.element(screen.getByRole("link", { name: "General" })).toBeVisible();
		await expect.element(screen.getByRole("link", { name: "Security" })).toBeVisible();
	});

	it("rail click on the already-active module does not navigate", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const onNavigate = vi.fn();
		await render(Harness, { pathname: "/app/dashboard", onNavigate });
		const rail = page.getByRole("navigation", { name: "Module navigation" }).first();
		await rail.getByRole("button", { name: "Application" }).click();
		expect(onNavigate).not.toHaveBeenCalled();
	});

	it("derives the active module from pathname", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/settings/security" });
		const rail = page.getByRole("navigation", { name: "Module navigation" }).first();
		await expect
			.element(rail.getByRole("button", { name: "Settings" }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(screen.getByRole("link", { name: "Security" }))
			.toHaveAttribute("aria-current", "page");
	});

	it("omits the panel for a module with a single destination", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { pathname: "/settings/general", single: true });
		await expect.poll(() => q(".ca-panel")).toBeNull();
	});

	it("main content shifts right of the sidebar", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { pathname: "/app/dashboard" });
		await expect
			.poll(() => (q(".ca-main") as HTMLElement).getBoundingClientRect().left)
			.toBe(52 + 200);
	});

	it("settles on the exact integer offset (never a sub-pixel like 251.984)", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { pathname: "/app/dashboard" });
		const main = () => q(".ca-main") as HTMLElement;
		const panelWidth = () => (q(".ca-panel") as HTMLElement | null)?.getBoundingClientRect().width;

		await settledOffset(main);
		// The spring must land on the target, not within `precision` of it.
		expect(main().style.getPropertyValue("--ca-main-ml")).toBe("calc(52px + 200px)");
		expect(main().getBoundingClientRect().left).toBe(252);
		expect(panelWidth()).toBe(200);
	});

	it("settles on the exact integer offset after closing and reopening the panel", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/app/dashboard", full: true });
		const main = () => q(".ca-main") as HTMLElement;

		await screen.getByRole("button", { name: "Close navigation" }).click();
		await settledOffset(main);
		expect(main().style.getPropertyValue("--ca-main-ml")).toBe("calc(52px + 0px)");
		expect(main().getBoundingClientRect().left).toBe(52);

		await screen.getByRole("button", { name: "Open navigation" }).click();
		await settledOffset(main);
		expect(main().style.getPropertyValue("--ca-main-ml")).toBe("calc(52px + 200px)");
		expect(main().getBoundingClientRect().left).toBe(252);
		expect((q(".ca-panel") as HTMLElement).getBoundingClientRect().width).toBe(200);
	});

	it("paints the offset the spring computed, frame by frame (no extra CSS smoothing)", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/app/dashboard", full: true });
		const main = () => q(".ca-main") as HTMLElement;
		await settledOffset(main);

		await screen.getByRole("button", { name: "Close navigation" }).click();
		let mismatched = 0;
		for (let i = 0; i < 90; i++) {
			await new Promise((r) => requestAnimationFrame(() => r(null)));
			const m = /calc\(52px \+ ([\d.e-]+)px\)/.exec(main().style.getPropertyValue("--ca-main-ml"));
			// Layout snaps to 1/64px: compare at that resolution.
			if (Math.abs(52 + Number(m?.[1]) - main().getBoundingClientRect().left) > 1 / 64)
				mismatched++;
		}
		expect(mismatched).toBe(0);
	});

	it("with reduced motion the offset is the exact target immediately", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await cdp().send("Emulation.setEmulatedMedia", {
			features: [{ name: "prefers-reduced-motion", value: "reduce" }],
		});
		try {
			reducedMotion.init();
			const screen = await render(Harness, { pathname: "/app/dashboard", full: true });
			const main = () => q(".ca-main") as HTMLElement;
			await settledOffset(main);

			await screen.getByRole("button", { name: "Close navigation" }).click();
			// No spring frames: one frame after the click the offset is already the exact target.
			await new Promise((r) => requestAnimationFrame(() => r(null)));
			await new Promise((r) => requestAnimationFrame(() => r(null)));
			expect(main().style.getPropertyValue("--ca-main-ml")).toBe("calc(52px + 0px)");
			expect(main().getBoundingClientRect().left).toBe(52);
		} finally {
			await cdp().send("Emulation.setEmulatedMedia", { features: [] });
		}
	});

	it("renders brand, railBottom and a panel toggle", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/app/dashboard", full: true });
		await expect.element(screen.getByText("Brand").first()).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Account" })).toBeVisible();
		await expect.poll(() => q(".ca-panel")).not.toBeNull();

		await screen.getByRole("button", { name: "Close navigation" }).click();
		await expect.element(screen.getByRole("button", { name: "Open navigation" })).toBeVisible();
		await expect.poll(() => q(".ca-panel")).toBeNull();

		await screen.getByRole("button", { name: "Open navigation" }).click();
		await expect.poll(() => q(".ca-panel")).not.toBeNull();
	});

	it("has no axe violations", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/app/dashboard", full: true });
		await expect
			.poll(() => (q(".ca-panel") as HTMLElement | null)?.getBoundingClientRect().width)
			.toBe(200);
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("AppShellLayout: mobile", () => {
	it("shows bottom nav + mobile header, hides rail and panel", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness, { pathname: "/app/dashboard" });

		expect(visible(q(".ca-bottom-nav"))).toBe(true);
		expect(visible(q(".ca-mobile-header"))).toBe(true);
		expect(visible(q(".ca-sidebar"))).toBe(false);
		expect(visible(q(".ca-rail"))).toBe(false);
		// main is not offset by the (hidden) sidebar
		expect((q(".ca-main") as HTMLElement).getBoundingClientRect().left).toBe(0);

		const nav = page.getByRole("navigation", { name: "Module navigation" });
		await expect.element(nav.getByRole("button", { name: "Application" })).toBeVisible();
		await expect.element(nav.getByRole("button", { name: "Settings" })).toBeVisible();
	});

	it("mobile header shows the active page title", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness, { pathname: "/app/docs" });
		await expect.element(page.getByRole("banner")).toMatchTextContent("Documents");
	});

	it("bottom nav click calls onNavigate with the module's first path", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const onNavigate = vi.fn();
		await render(Harness, { pathname: "/app/dashboard", onNavigate });
		const nav = page.getByRole("navigation", { name: "Module navigation" });
		await nav.getByRole("button", { name: "Settings" }).click();
		expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/settings/general");
		await expect
			.element(nav.getByRole("button", { name: "Settings" }))
			.toHaveAttribute("aria-current", "page");
	});

	it("renders mobileHeaderActions in the mobile header", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { pathname: "/app/dashboard", full: true });
		await expect.element(screen.getByRole("button", { name: "Actions" })).toBeVisible();
	});

	it("has no axe violations", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { pathname: "/app/dashboard", full: true });
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("AppShellLayout: breakpoint", () => {
	it("switches to the desktop layout at exactly 900px", async () => {
		await page.viewport(...VIEWPORTS.tablet);
		await render(Harness);
		expect(visible(q(".ca-rail"))).toBe(true);
		expect(visible(q(".ca-bottom-nav"))).toBe(false);
	});
});

describe("AppShellLayout: skip link", () => {
	it("is the first tab stop and moves focus to the content region (#main)", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/app/dashboard" });
		await userEvent.tab();
		const link = screen.getByRole("link", { name: "Skip to content" });
		expect(document.activeElement).toBe(link.element());
		await userEvent.keyboard("{Enter}");
		expect(document.activeElement).toBe(q(".ca-shell__content"));
		expect(document.querySelectorAll("#main")).toHaveLength(1);
	});

	it("mainId={null} targets the page's own <main id=main>: one id, one main landmark", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/app/dashboard", ownMain: true });
		await userEvent.tab();
		await userEvent.keyboard("{Enter}");
		expect(document.activeElement?.tagName).toBe("MAIN");
		expect(document.querySelectorAll("#main")).toHaveLength(1);
		expect(document.querySelectorAll("main")).toHaveLength(1);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
