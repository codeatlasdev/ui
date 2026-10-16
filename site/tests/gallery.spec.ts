import { runPick } from "../../packages/ui/src/cli/pick";
import { expect, gotoReady, test } from "./fixtures";

test.describe("gallery", () => {
	test("?pick= preselects cards and the copy text lists them in id order", async ({ page }) => {
		await gotoReady(page, "/gallery/?pick=002,001");
		await expect(page.locator("[id='001']").getByRole("checkbox")).toBeChecked();
		await expect(page.locator("[id='002']").getByRole("checkbox")).toBeChecked();
		await expect(page.locator("[id='003']").getByRole("checkbox")).not.toBeChecked();

		const copy = page.getByTestId("gallery-picks");
		const text = await copy.getAttribute("data-value");
		expect(text).toMatch(
			/^I picked these 2 from the @codeatlasdev\/ui gallery:\n#001 .+\n#002 .+$/
		);
	});

	test("picking a card updates ?pick= and the sticky bar", async ({ page }) => {
		await gotoReady(page, "/gallery/");
		await expect(page.getByTestId("gallery-picks")).toHaveCount(0);
		const box = page.getByText("Pick #005", { exact: true });
		await box.click();
		await expect(page.locator("[id='005']").getByRole("checkbox")).toBeChecked();
		await expect(page.getByTestId("gallery-picks")).toHaveCount(1);
		await expect(page).toHaveURL(/\?pick=005$/);
		await box.click();
		await expect(page).not.toHaveURL(/pick=/);
	});

	test("#010 deep link scrolls the card into view", async ({ page }) => {
		await gotoReady(page, "/gallery/#010");
		await expect(page.locator("[id='010']")).toBeInViewport();
	});

	test("filtering by a word narrows the cards", async ({ page }) => {
		await gotoReady(page, "/gallery/");
		const cards = page.locator("article.gallery-card");
		const all = await cards.count();
		expect(all).toBeGreaterThan(200);
		await page.getByRole("textbox", { name: /filter/i }).fill("loading");
		await expect.poll(() => cards.count()).toBeLessThan(all);
		expect(await cards.count()).toBeGreaterThan(0);
	});

	test("Send to AI only appears with a loopback ?cb=", async ({ page }) => {
		await gotoReady(page, "/gallery/?pick=001");
		await expect(page.getByRole("button", { name: /send to ai/i })).toHaveCount(0);
		await gotoReady(page, "/gallery/?pick=001&cb=https%3A%2F%2Fevil.example%2Fx");
		await expect(page.getByRole("button", { name: /send to ai/i })).toHaveCount(0);
		await gotoReady(page, "/gallery/?pick=001&cb=http%3A%2F%2F127.0.0.1%3A4599%2Fpick%3Ft%3Dabc");
		await expect(page.getByRole("button", { name: /send to ai/i })).toBeVisible();
	});
});

test.describe("gallery handoff to `codeatlas-ui pick`", () => {
	test("Send to AI delivers the picked ids to the CLI listener", async ({ page, baseURL }) => {
		let link = "";
		const result = runPick({
			gallery: `${baseURL}/gallery/`,
			ids: ["001"],
			timeoutMs: 20_000,
			open: (url) => (link = url),
			log: () => {},
		});
		await expect.poll(() => link).not.toBe("");
		await gotoReady(page, link.replace(baseURL ?? "", ""));
		await expect(page.locator("[id='001']").getByRole("checkbox")).toBeChecked();
		await page.getByText("Pick #005", { exact: true }).click();
		await page.getByRole("button", { name: /send to ai/i }).click();
		expect(await result).toEqual({ ids: ["001", "005"] });
		await expect(page.getByText(/You can close this tab/)).toBeVisible();
	});
});
