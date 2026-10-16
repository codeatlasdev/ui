import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./AppShellNavigation.test.svelte";

const q = (sel: string) => document.querySelector(sel);
// The shell chrome: every node here must be the very same element after any number of navigations.
const CHROME = [".ca-shell", ".ca-rail", ".ca-panel", ".ca-shell__content"];

describe("AppShellLayout: client-side navigation", () => {
	it("keeps rail, panel and main mounted across 10 navigations", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {});
		const { go } = screen.component as unknown as { go: (p: string) => void };
		const before = CHROME.map((s) => q(s));
		expect(before.every(Boolean), "chrome present").toBe(true);

		const cycle = ["/app/docs", "/app/users", "/app/reports/weekly", "/app/dashboard", "/app/docs"];
		for (let i = 0; i < 10; i++) {
			go(cycle[i % cycle.length]);
			await expect
				.poll(() => q("[data-testid=page] h1")?.textContent)
				.toBe(cycle[i % cycle.length]);
		}

		// Same DOM nodes: nothing was torn down and recreated.
		for (const [i, s] of CHROME.entries()) expect(q(s), s).toBe(before[i]);
		// The page body below the shell is what changes: a fresh element per navigation.
		const count = (screen.component as unknown as { mountCount: () => number }).mountCount();
		expect(count).toBeGreaterThanOrEqual(10);
		// The active link follows the URL.
		await expect
			.element(page.getByRole("link", { name: "Documents" }))
			.toHaveAttribute("aria-current", "page");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps a collapsed section collapsed while navigating", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {});
		const reports = page.getByRole("button", { name: "Reports" });
		await reports.click();
		await expect.element(reports).toHaveAttribute("aria-expanded", "false");
		const { go } = screen.component as unknown as { go: (p: string) => void };
		for (const p of ["/app/docs", "/app/users", "/app/dashboard"]) {
			go(p);
			await expect.poll(() => q("[data-testid=page] h1")?.textContent).toBe(p);
		}
		await expect.element(reports).toHaveAttribute("aria-expanded", "false");
	});
});
