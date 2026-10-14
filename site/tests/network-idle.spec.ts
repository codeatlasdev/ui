import { expect, networkIdle, test } from "./fixtures";

test.describe("networkIdle", () => {
	test("a stalled request fails the wait with an error naming the pending URL", async ({
		page,
	}) => {
		// Never fulfilled: stays in flight until the test ends.
		await page.route("**/__stalled__/slow.js", () => {});
		await page.goto("/");
		await networkIdle(page); // the page itself settles
		await page.evaluate(() => {
			const s = document.createElement("script");
			s.src = "/__stalled__/slow.js";
			document.head.append(s);
		});
		const err = await networkIdle(page, { timeout: 1_500 }).then(
			() => null,
			(e: Error) => e
		);
		expect(err, "the stalled request must keep the page from going idle").not.toBeNull();
		expect(err?.message).toContain("GET http://localhost:");
		expect(err?.message).toContain("/__stalled__/slow.js (script,");
	});

	test("resolves once requests finish", async ({ page }) => {
		await page.goto("/");
		await networkIdle(page, { idleMs: 200, timeout: 10_000 });
	});
});
