import { expect, networkIdle, test, waitIslands } from "./fixtures";
import { ROUTES } from "./routes";

test.describe("routes smoke", () => {
	for (const route of ROUTES) {
		test(route, async ({ page, consoleErrors }) => {
			const res = await page.goto(route);
			expect(res?.status()).toBe(200);
			await expect(page).toHaveTitle(/\S/);
			await expect(page.getByRole("main")).toBeVisible();
			await expect(page.getByRole("main")).toHaveCount(1);
			await networkIdle(page);
			await waitIslands(page);
			expect(consoleErrors, `console/page errors on ${route}`).toEqual([]);
		});
	}
});
