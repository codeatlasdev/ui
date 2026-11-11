import { devices } from "@playwright/test";
import { expect, gotoReady, settleDom, test } from "./fixtures";
import { audit } from "./layout-audit";

// Pages whose demos shipped with 32px hit areas and overlapping controls at 390px (#962): the
// layout audit at the Pixel 7 size on a coarse pointer, the widest phone the route sweep (360px)
// does not look at.
const PAGES = ["/docs/layout/master-detail/", "/docs/layout/sortable-list/"];

test.use({ ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, colorScheme: "dark" });

test.describe("demo layout at 390x844, coarse pointer", () => {
	test.skip(({ hasTouch }) => !hasTouch, "coarse pointer only");

	for (const route of PAGES) {
		test(route, async ({ page }) => {
			await gotoReady(page, route);
			await settleDom(page);
			expect(await audit(page, true)).toEqual([]);
		});
	}
});
