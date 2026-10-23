import { expect, test, waitIslands } from "./fixtures";

// #470: deck.gl 9.4 throws on every frame inside maplibre-gl 6, so the docs map logged ~100 page errors.
// The smoke test only waits for hydration; here the map draws frames in both schemes first.
test.describe("map docs page", () => {
	for (const scheme of ["light", "dark"] as const) {
		test.describe(scheme, () => {
			test.use({ theme: { scheme } });

			test("draws the deck.gl demo without console or page errors", async ({
				page,
				consoleErrors,
			}) => {
				await page.goto("/docs/map/");
				await waitIslands(page);
				const map = page.getByRole("region", { name: "Store map" });
				await map.scrollIntoViewIfNeeded();
				await expect(map.locator("canvas.maplibregl-canvas")).toBeVisible();
				// deck.gl is an interleaved layer: the error fires per rendered frame.
				await page.evaluate(
					() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
				);
				await page.waitForTimeout(1000);
				expect(consoleErrors, "console/page errors on /docs/map/").toEqual([]);
			});
		});
	}
});
