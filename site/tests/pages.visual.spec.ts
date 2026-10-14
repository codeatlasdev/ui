import { expect, settle, test, waitIslands } from "./fixtures";

const PAGES = [
	"/",
	"/docs/",
	"/docs/foundation/colors/",
	"/docs/inputs/button/",
	"/docs/inputs/text-field/",
	"/docs/inputs/date-picker/",
	"/docs/feedback/dialog/",
	"/docs/navigation/app-bar/",
	"/docs/display/data-table/",
	"/docs/display/table/",
	"/docs/layout/app-shell/",
	"/templates/app/dashboard/",
	"/templates/auth/sign-in/",
	"/templates/",
	"/theme/",
];

const slug = (p: string) => (p === "/" ? "home" : p.replace(/^\/|\/$/g, "").replaceAll("/", "-"));

async function prepare(page: import("@playwright/test").Page, route: string) {
	await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
	await page.goto(route);
	await page.waitForLoadState("networkidle");
	await waitIslands(page);
	await page.mouse.move(-1, -1);
	await settle(page);
}

for (const scheme of ["dark", "light"] as const) {
	test.describe(`visual ${scheme}`, () => {
		test.use({ theme: { scheme }, colorScheme: scheme });

		for (const route of PAGES) {
			test(route, async ({ page }) => {
				await prepare(page, route);
				// Layout heights are fractional (e.g. 2054.86px); a bare fullPage capture rounds them
				// differently between the two shots Playwright compares. Pin an integer clip once.
				const { width, height } = await page.evaluate(() => {
					const r = document.documentElement.getBoundingClientRect();
					return { width: Math.floor(r.width), height: Math.floor(r.height) };
				});
				await expect(page).toHaveScreenshot(`${slug(route)}-${scheme}.webp`, {
					fullPage: true,
					clip: { x: 0, y: 0, width, height },
					// The chart box, not the canvas: ECharts re-creates its canvas when the full-page capture
					// resizes the viewport, so the canvas box moves between the two compared shots.
					mask: [page.locator(".ca-chart-wrap, canvas")],
				});
			});
		}

		test("overlays open", async ({ page }) => {
			await prepare(page, "/docs/feedback/dialog/");
			await page.getByRole("button", { name: "View details" }).first().click();
			await settle(page);
			await expect(page.getByRole("dialog")).toHaveScreenshot(`dialog-${scheme}.webp`);

			await prepare(page, "/docs/feedback/sheet/");
			await page.getByRole("button", { name: "Open sheet" }).first().click();
			await settle(page);
			await expect(page.getByRole("dialog")).toHaveScreenshot(`sheet-${scheme}.webp`);

			await prepare(page, "/docs/navigation/command-palette/");
			await page.getByRole("button", { name: "Open command palette" }).first().click();
			await settle(page);
			await expect(page.getByRole("dialog")).toHaveScreenshot(`command-palette-${scheme}.webp`);
		});
	});
}
