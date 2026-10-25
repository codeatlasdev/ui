import { expect, expectNoViolations, gotoReady, makeAxe, test } from "./fixtures";

test.describe("gallery viewer", () => {
	test("/gallery/<id>/ shows the demo large, resizes, themes and pages with arrows", async ({
		page,
	}) => {
		await gotoReady(page, "/gallery/001/");
		await expect(page.getByRole("heading", { level: 1, name: "Full width" })).toBeVisible();
		const stage = page.getByRole("group", { name: /^Full width at/ });
		await expect(stage.getByRole("button", { name: "Continue" })).toBeVisible();

		// Width presets: the frame is laid out at exactly that many CSS px. A stage narrower than the frame
		// (a phone) scales the whole viewport down, so the layout width is read, not the transformed box.
		const frame = page.locator(".ca-pstage__frame");
		await page.getByRole("radio", { name: "390", exact: true }).click();
		await expect.poll(() => frame.evaluate((el) => (el as HTMLElement).offsetWidth)).toBe(390);
		await expect(page).toHaveURL(/[?&]w=390/);

		// Scheme is per stage: the page around it keeps its own.
		await page.getByRole("radio", { name: "Light" }).click();
		await expect(page.locator(".ca-theme-island")).toHaveAttribute("data-theme-scope", "light");
		await expect(page.locator("html")).toHaveClass(/dark/);

		// The splitter is keyboard operable.
		const split = page.getByRole("separator", { name: /resize preview width/i });
		await split.focus();
		await page.keyboard.press("ArrowRight");
		await expect(split).toHaveAttribute("aria-valuenow", "400");

		// Code tab shows the source.
		await page.getByRole("tab", { name: "Code" }).click();
		await expect(page.getByText("<Button fullWidth>")).toBeVisible();

		// Arrow keys move through the set (focus off the controls first).
		await page.getByRole("tab", { name: "Preview" }).click();
		await page.locator("h1").click();
		await page.keyboard.press("ArrowRight");
		await expect(page).toHaveURL(/\/gallery\/002\//);
	});

	test("Pick and Copy prompt", async ({ page }) => {
		await gotoReady(page, "/gallery/005/");
		await page.getByRole("button", { name: "Pick", exact: true }).click();
		await expect(page).toHaveURL(/pick=005/);
		await expect(page.getByRole("button", { name: "Picked #005" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
		const prompt = await page.getByTestId("viewer-prompt").getAttribute("data-value");
		expect(prompt).toContain('get_demo({ ids: ["#005"] })');
	});

	test("a page renders in an iframe at the chosen width and follows the scheme", async ({
		page,
	}) => {
		await gotoReady(page, "/gallery/page-auth-sign-in/?w=390&scheme=light");
		const iframe = page.locator("iframe.ca-pstage__iframe");
		await expect(iframe).toHaveAttribute("title", /Sign in at 390 pixels/);
		// Laid out at 390 CSS px even when the stage is narrower and scales the frame down to fit.
		expect(await iframe.evaluate((el) => (el as HTMLElement).offsetWidth)).toBe(390);
		const inner = page.frameLocator("iframe.ca-pstage__iframe");
		await expect(inner.locator("html")).not.toHaveClass(/dark/);
		await page.getByRole("radio", { name: "Dark" }).click();
		await expect(inner.locator("html")).toHaveClass(/dark/);
	});

	test("axe is clean on the viewer", async ({ page }, info) => {
		await gotoReady(page, "/gallery/001/");
		await expectNoViolations(await makeAxe(page).analyze(), info);
	});
});
