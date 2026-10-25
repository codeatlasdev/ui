import { VISUAL_ROUTES } from "../../scripts/route-impact";
import { expect, settle, test, waitIslands } from "./fixtures";

// The pages whose own composition is what a screenshot can show: the landing, the templates and the theme
// editor, at the visible viewport (the first screen a visitor sees). Every docs page is a stack of component
// demos that the component baselines (packages/ui `*.vrt.test.ts`) already compare one by one, and the layout
// audit (routes.spec.ts) checks their geometry on every route, so a tall full-page docs shot added only the
// slowest and flakiest copy of both. The list is `VISUAL_ROUTES` (scripts/route-impact.ts), which the land gate
// also reads to rebuild these pages.

// Per-test timeout: a viewport shot is taken twice and compared (and written when updating); the
// 5 s expect and 30 s test defaults are enough on a native machine, so only the shot itself is bounded.
const SHOT_TIMEOUT = 30_000;

const slug = (p: string) => (p === "/" ? "home" : p.replace(/^\/|\/$/g, "").replaceAll("/", "-"));

async function prepare(page: import("@playwright/test").Page, route: string) {
	await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
	await page.goto(route);
	await waitIslands(page);
	await page.mouse.move(-1, -1);
	await settle(page);
}

for (const scheme of ["dark", "light"] as const) {
	test.describe(`visual ${scheme}`, () => {
		test.use({ theme: { scheme }, colorScheme: scheme });

		for (const route of VISUAL_ROUTES) {
			test(route, async ({ page }) => {
				await prepare(page, route);
				// Visible viewport only: no `fullPage`, so no layout-height rounding between the two compared
				// shots. No `mask`: Playwright places mask boxes from a layout read during the capture, and they
				// drift between the shots; canvases are hidden in-layout by tests/screenshot.css (stylePath).
				await expect(page).toHaveScreenshot(`${slug(route)}-${scheme}.webp`, {
					timeout: SHOT_TIMEOUT,
				});
			});
		}
	});
}
