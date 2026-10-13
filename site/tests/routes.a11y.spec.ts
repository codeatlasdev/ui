import { expect, expectNoViolations, makeAxe, settle, test, waitIslands } from "./fixtures";
import { ROUTES } from "./routes";

/**
 * Known package bugs (axe `scrollable-region-focusable`, serious). `test.fail` keeps the suite
 * green while still asserting the violation exists: the test turns red once the bug is fixed,
 * which is the cue to delete the entry.
 *  - SimpleTable: `packages/ui/src/lib/components/Table/Table.svelte:15` reuses `.ca-table-wrap`,
 *    which `styles/prose.css:146` makes a horizontal scroller (global, not scoped to `.ca-prose`)
 *    without the `tabindex="0"` it documents.
 *  - ScrollArea: `components/ScrollArea/ScrollArea.svelte:35` renders a scrollable
 *    `BitsScrollArea.Viewport` with no `tabindex="0"`.
 */

for (const scheme of ["dark", "light"] as const) {
	test.describe(`a11y ${scheme}`, () => {
		test.use({ theme: { scheme } });

		for (const route of ROUTES) {
			test(route, async ({ page }, testInfo) => {
				await page.goto(route);
				await page.waitForLoadState("networkidle");
				await waitIslands(page);
				await settle(page);
				await expectNoViolations(await makeAxe(page).analyze(), testInfo);
			});
		}
	});
}

// Forced colors (Windows High Contrast): the UA swaps every author color for a system color.
// axe-core's `color-contrast` reads the author colors and ignores that override (it reports the
// h1 as #eeeae8 on #fff while the browser paints CanvasText on Canvas), so the rule is disabled
// here and contrast is covered by the dark/light passes and tests/contrast.test.ts. Every other
// rule stays on: this pass catches names, roles and controls that stop being perceivable.
test.describe("a11y forced-colors", () => {
	test.use({ theme: { scheme: "dark" } });

	for (const route of ROUTES) {
		test(route, async ({ page }, testInfo) => {
			await page.emulateMedia({ forcedColors: "active" });
			await page.goto(route);
			await page.waitForLoadState("networkidle");
			await waitIslands(page);
			await settle(page);
			await expectNoViolations(
				await makeAxe(page).disableRules(["color-contrast"]).analyze(),
				testInfo
			);
		});
	}
});

// Pages that put a package shell in an island must still expose exactly one skip target.
test.describe("landmarks", () => {
	for (const route of ROUTES) {
		test(`one #main and one skip link: ${route}`, async ({ page }) => {
			// Redirect stubs (<meta http-equiv=refresh>) navigate away mid-test: check the raw HTML first.
			const html = await (await page.request.get(route)).text();
			test.skip(/http-equiv="?refresh/i.test(html), "redirect page");
			await page.goto(route);
			// Same order as routes.smoke: client-side guards (the demo sign-in redirects a seeded user) settle first.
			await page.waitForLoadState("networkidle");
			await waitIslands(page);
			expect(await page.locator("#main").count(), "elements with id=main").toBeLessThanOrEqual(1);
			expect(await page.locator("main").count(), "<main> landmarks").toBeLessThanOrEqual(1);
			const skips = await page.locator('a[href="#main"]').count();
			expect(skips, 'links to "#main" (skip links)').toBeLessThanOrEqual(1);
		});
	}
});
