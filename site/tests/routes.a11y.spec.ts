import { expect, expectNoViolations, makeAxe, settle, test, waitIslands } from "./fixtures";
import { ROUTES } from "./routes";

// One navigation per route, every accessibility check on it. The page follows the OS scheme
// (`system`), so `emulateMedia` switches dark → light → forced colors live, exactly like a user
// changing their OS setting, without reloading.
test.use({ theme: { scheme: "system" } });

for (const route of ROUTES) {
	test(route, async ({ page }, testInfo) => {
		// Redirect stubs (<meta http-equiv=refresh>) navigate away mid-test: check the raw HTML first.
		const html = await (await page.request.get(route)).text();
		test.skip(/http-equiv="?refresh/i.test(html), "redirect page");
		// /gallery/ renders one card per catalog demo (255 cards, ~4,300 nodes), so its axe work grows
		// with the catalog: one full pass measured 5.7 s alone (no dominant rule: region 1.2 s,
		// color-contrast 0.9 s…), and this test runs three. The default 30 s fits every other route but
		// not this one under a full parallel run (#250).
		if (route === "/gallery/") test.slow();

		// A signed-in user is bounced off sign-in pages (mid-test navigation): check them signed out.
		if (route.endsWith("/sign-in/"))
			await page.addInitScript(() => localStorage.removeItem("ca_auth"));
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto(route);
		await waitIslands(page);

		// Pages that put a package shell in an island must still expose exactly one skip target.
		expect(await page.locator("#main").count(), "elements with id=main").toBeLessThanOrEqual(1);
		expect(await page.locator("main").count(), "<main> landmarks").toBeLessThanOrEqual(1);
		expect(await page.locator('a[href="#main"]').count(), "skip links").toBeLessThanOrEqual(1);

		for (const scheme of ["dark", "light"] as const) {
			await page.emulateMedia({ colorScheme: scheme });
			await expect(page.locator("html")).toHaveClass(
				scheme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/
			);
			await settle(page);
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, scheme);
		}

		// Forced colors (Windows High Contrast): the UA swaps every author color for a system color.
		// axe-core's `color-contrast` reads the author colors and ignores that override, so the rule
		// is off here (contrast is covered above and by packages/ui/tests/contrast.test.ts). Every
		// other rule stays on: this pass catches names, roles and controls that stop being perceivable.
		await page.emulateMedia({ colorScheme: "dark", forcedColors: "active" });
		await settle(page);
		await expectNoViolations(
			await makeAxe(page).disableRules(["color-contrast"]).analyze(),
			testInfo,
			"forced-colors"
		);
	});
}
