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
		// A signed-in user is bounced off sign-in pages (mid-test navigation): check them signed out.
		if (route.endsWith("/sign-in/"))
			await page.addInitScript(() => localStorage.removeItem("ca_auth"));
		if (process.env.A11Y_CPU_THROTTLE)
			await (await page.context().newCDPSession(page)).send("Emulation.setCPUThrottlingRate", {
				rate: Number(process.env.A11Y_CPU_THROTTLE),
			});
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto(route);
		await waitIslands(page);

		// axe walks every node and this test runs it three times (dark, light, forced colors), so the
		// work grows with the page: /docs/getting-started/recipes/ (10k nodes, mostly shiki token
		// spans) needs 5.5 s per pass alone, /gallery/ (4.3k nodes) 5.7 s, a 1k-node docs page 0.6 s.
		// A fixed 30 s fits the small pages and loses to load on the big ones (#533), and a hand-kept
		// list of slow routes (#250, #316) misses the next big page. Budget each route from its own
		// node count instead: a 15 s floor plus 3 passes at 4x the measured cost per node, 3x load.
		const nodes = await page.evaluate(() => document.getElementsByTagName("*").length);
		test.setTimeout(Math.max(30_000, 15_000 + nodes * 3 * 1.2 * 4));

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
