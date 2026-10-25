import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { sweepRoutes } from "../../scripts/route-impact";
import { expect, gotoReady, settleDom, test, waitIslands } from "./fixtures";
import { audit } from "./layout-audit";
import { DIST, ROUTES } from "./routes";

/**
 * One pass per route for everything except axe (routes.axe.spec.ts, its own project so it shards
 * and runs beside this one). Each route is loaded once per project and the same load runs:
 *
 *  - smoke: 200, a title, exactly one <main>, no console/page errors, one skip target;
 *  - layout audit (no sideways scroll, no overlap, no clipped text; mobile: 44px targets) at the
 *    project's own viewport: 1280x800 on desktop, 360x780 on mobile (the narrowest common phone);
 *  - desktop only, same load: the viewport sweep (in-between widths and a short landscape phone,
 *    resized inside the page) on routes that render layout primitives or changed.
 *
 * It replaced routes.smoke, layout and routes.a11y, which loaded every page 8 times between them.
 */
const REDIRECT_STUB = 'http-equiv="refresh"';

// Meta-refresh redirect stubs render nothing; their targets are routes of their own.
const PAGES = ROUTES.filter(
	(r) => !readFileSync(join(DIST, r, "index.html"), "utf8").includes(REDIRECT_STUB)
);

// Routes touched by the diff against origin/main (empty on a clean tree or without git/origin).
function changedFiles(): string[] {
	try {
		const run = (...args: string[]) =>
			execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
		const base = run("merge-base", "HEAD", "origin/main").trim();
		return [
			...run("diff", "--name-only", base).split("\n"),
			...run("ls-files", "-o", "--exclude-standard").split("\n"),
		].filter(Boolean);
	} catch {
		return [];
	}
}
const SWEEP = sweepRoutes(PAGES, changedFiles());

// Viewport sweep (viewport_complete §15.2): the in-between widths and a short landscape phone,
// where fixed heights and two-column breakpoints break first. Desktop project only: the device
// emulation stays fine-pointer, so this checks geometry, not touch targets.
const VIEWPORTS = [
	{ name: "tablet 768", width: 768, height: 1024 },
	{ name: "laptop 1024", width: 1024, height: 768 },
	{ name: "landscape 844x390", width: 844, height: 390 },
] as const;

for (const route of PAGES) {
	test(route, async ({ page, isMobile, consoleErrors }) => {
		// A signed-in user is bounced off sign-in pages (mid-test navigation): check them signed out.
		if (route.endsWith("/sign-in/"))
			await page.addInitScript(() => localStorage.removeItem("ca_auth"));
		// Narrowest common phone width: anything that fits at 360px fits on larger phones.
		if (isMobile) await page.setViewportSize({ width: 360, height: 780 });

		const res = await page.goto(route, { waitUntil: "domcontentloaded" });
		expect(res?.status()).toBe(200);
		await expect(page).toHaveTitle(/\S/);
		await waitIslands(page);
		await settleDom(page);

		// Smoke: exactly one landmark and one skip target (a package shell in an island must not add one).
		expect(await page.locator("main").count(), "<main> landmarks").toBe(1);
		expect(await page.locator("#main").count(), "elements with id=main").toBeLessThanOrEqual(1);
		expect(await page.locator('a[href="#main"]').count(), "skip links").toBeLessThanOrEqual(1);
		expect(consoleErrors, `console/page errors on ${route}`).toEqual([]);

		expect(await audit(page, isMobile), "layout at the project viewport").toEqual([]);
		if (isMobile) return;

		if (SWEEP.has(route))
			for (const vp of VIEWPORTS) {
				await page.setViewportSize({ width: vp.width, height: vp.height });
				// Breakpoints can mount or hide islands: settle again at the new width.
				await waitIslands(page);
				await settleDom(page);
				expect(await audit(page, false), `layout @ ${vp.name}`).toEqual([]);
			}
		await page.setViewportSize({ width: 1280, height: 800 });
	});
}

// Below 900px the theme studio shows the preview and opens each panel in a sheet from a toolbar
// button: each open panel must hold the same guarantees.
for (const panel of ["Controls", "Code"]) {
	test(`/theme/ (${panel} panel, mobile)`, async ({ page, isMobile }) => {
		test.skip(!isMobile, "panels are sheets only on narrow screens");
		await page.setViewportSize({ width: 360, height: 780 });
		await gotoReady(page, "/theme/");
		await page
			.getByRole("toolbar", { name: "Theme studio actions" })
			.getByRole("button", { name: panel, exact: true })
			.click();
		await expect(page.getByRole("dialog")).toBeVisible();
		expect(await audit(page, isMobile)).toEqual([]);
	});
}
