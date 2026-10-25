import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, expectNoViolations, makeAxe, settleDom, test, waitIslands } from "./fixtures";
import { DIST, ROUTES } from "./routes";

/**
 * axe on every route, in its own Playwright project (`axe`) so it shards and runs beside the layout
 * project. One load per route, three runs on it, every rule on in each (contrast included):
 *
 *  - dark and light: `emulateMedia` switches the scheme live, like a user changing the OS setting;
 *  - forced colors (Windows High Contrast): the UA swaps every author color for a system color.
 *    axe's `color-contrast` reads author colors and ignores that override, so it is off here and
 *    measured in the two runs above; every other rule runs, which catches names, roles and controls
 *    that stop being perceivable. (Measured: with contrast on, a forced-colors run costs as much as
 *    a normal one and checks nothing new.)
 *
 * `<pre>` is excluded from every run: a docs page holds thousands of Shiki token spans (8.4k of the
 * 10.1k nodes of /docs/getting-started/recipes/, 14.4 s per run, 1.9 s without them) and the
 * highlighted palette is proven for both schemes by CodeSnippet.svelte.test.ts. A code listing is
 * checked for structure by tests/dist-html.spec.ts.
 *
 * `A11Y_CPU_THROTTLE=<n>` (CDP CPU throttling) reproduces a loaded machine deterministically.
 */
const PAGES = ROUTES.filter(
	(r) => !readFileSync(join(DIST, r, "index.html"), "utf8").includes('http-equiv="refresh"')
);

// The page follows the OS scheme (`system`).
test.use({ theme: { scheme: "system" } });

for (const route of PAGES) {
	test(route, async ({ page }, testInfo) => {
		// A signed-in user is bounced off sign-in pages (mid-test navigation): check them signed out.
		if (route.endsWith("/sign-in/"))
			await page.addInitScript(() => localStorage.removeItem("ca_auth"));
		if (process.env.A11Y_CPU_THROTTLE)
			await (await page.context().newCDPSession(page)).send("Emulation.setCPUThrottlingRate", {
				rate: Number(process.env.A11Y_CPU_THROTTLE),
			});
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto(route, { waitUntil: "domcontentloaded" });
		await waitIslands(page);

		// axe walks every node (0.69 ms per node per run): the budget grows with the page. A fixed 30 s
		// fits small pages and loses to load on the big ones (#533); a hand-kept list of slow routes
		// misses the next big page (#250, #316).
		const nodes = await page.evaluate(() => document.getElementsByTagName("*").length);
		test.setTimeout(Math.max(30_000, 15_000 + nodes * 3 * 1.2 * 4));

		for (const scheme of ["dark", "light"] as const) {
			await page.emulateMedia({ colorScheme: scheme });
			await expect(page.locator("html")).toHaveClass(
				scheme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/
			);
			await settleDom(page);
			await expectNoViolations(await makeAxe(page).exclude("pre").analyze(), testInfo, scheme);
		}

		await page.emulateMedia({ colorScheme: "dark", forcedColors: "active" });
		await settleDom(page);
		await expectNoViolations(
			await makeAxe(page).exclude("pre").disableRules(["color-contrast"]).analyze(),
			testInfo,
			"forced-colors"
		);
	});
}
