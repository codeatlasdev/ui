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

	test("pages are a category with thumbnail cards, beta marked", async ({ page }) => {
		await gotoReady(page, "/gallery/");
		await page.getByRole("radio", { name: "pages", exact: true }).click();
		const cards = page.locator("article.gallery-card");
		await expect(cards.first()).toBeVisible();
		for (const group of await page.locator(".gallery-card__group").allTextContents())
			expect(group).not.toMatch(/^\d/);
		expect(await cards.count()).toBeGreaterThan(20);
		await expect(page.locator(".gallery-card__beta").first()).toHaveText("beta");
		await expect(page.locator("[id='page-admin-dashboard']")).toBeVisible();
	});

	test("a card is a large preview with a clamped summary and an Open link", async ({ page }) => {
		await gotoReady(page, "/gallery/");
		const card = page.locator("[id='001']");
		const preview = card.locator(".gallery-card__preview");
		expect((await preview.boundingBox())?.height).toBeGreaterThanOrEqual(300);
		const lines = await card.locator(".gallery-card__summary").evaluate((el) => {
			const lh = Number.parseFloat(getComputedStyle(el).lineHeight);
			return el.getBoundingClientRect().height / lh;
		});
		expect(lines).toBeLessThanOrEqual(2.05);
		const open = card.getByRole("link", { name: "Open Full width" });
		await expect(open).toHaveAttribute("href", "/gallery/001/");
		await open.focus();
		await expect(card.locator(".gallery-card__open-label")).toHaveCSS("opacity", "1");
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

	test("facet chips filter instantly, with counts, and the state lives in the URL", async ({
		page,
	}) => {
		await gotoReady(page, "/gallery/");
		const cards = page.locator("article.gallery-card");
		const all = await cards.count();
		// The facets sit behind a disclosure so the cards stay near the top.
		await expect(page.getByRole("group", { name: "Kind" })).toHaveCount(0);
		await page.getByRole("button", { name: "Filters" }).click();
		const chip = page
			.getByRole("group", { name: "Kind" })
			.getByRole("button", { name: /^motion \(\d+\)$/ });
		const count = Number((await chip.textContent())?.match(/\((\d+)\)/)?.[1]);
		await chip.click();
		await expect(chip).toHaveAttribute("aria-pressed", "true");
		await expect(cards).toHaveCount(count);
		expect(count).toBeLessThan(all);
		await expect(page).toHaveURL(/[?&]kind=motion(&|$)/);
		// A second facet narrows further.
		await page.getByRole("group", { name: "Style" }).getByRole("button").first().click();
		expect(await cards.count()).toBeLessThanOrEqual(count);
		// Industry is not a published facet.
		await expect(page.getByRole("group", { name: "Industry" })).toHaveCount(0);
		await page.getByRole("button", { name: "Clear filters" }).click();
		await expect(cards).toHaveCount(all);
		await expect(page).not.toHaveURL(/kind=/);
	});

	test("a shared facet URL restores the filters and the query", async ({ page }) => {
		await gotoReady(page, "/gallery/?kind=motion&q=fade");
		await expect(
			page.getByRole("group", { name: "Kind" }).getByRole("button", { name: /^motion / })
		).toHaveAttribute("aria-pressed", "true");
		await expect(page.getByRole("textbox", { name: /filter/i })).toHaveValue("fade");
		await expect(page.locator("article.gallery-card").first()).toBeVisible();
		for (const group of await page.locator(".gallery-card__group").allTextContents())
			expect(group).toBe("motion");
		await expect(page.locator("[id='256']")).toBeVisible();
	});

	test("an impossible facet combination shows the empty state with a way out", async ({ page }) => {
		await gotoReady(page, "/gallery/?kind=component&motion=immersive&q=zzzqqq");
		await expect(page.locator("article.gallery-card")).toHaveCount(0);
		await page.getByRole("button", { name: "Clear the filters" }).click();
		await expect(page.locator("article.gallery-card").first()).toBeVisible();
	});

	test("a motion group filter lists motion demos, and a card plays only while in view", async ({
		page,
	}) => {
		await page.emulateMedia({ reducedMotion: "no-preference" });
		await gotoReady(page, "/gallery/");
		await page.getByRole("radio", { name: "motion", exact: true }).click();
		const cards = page.locator("article.gallery-card");
		await expect(cards.first()).toBeVisible();
		expect(await cards.count()).toBeGreaterThan(0);
		for (const group of await page.locator(".gallery-card__group").allTextContents())
			expect(group).toBe("motion");
		const stage = page.locator("[id='256']").getByRole("group", { name: /^Fade rise:/ });
		await stage.scrollIntoViewIfNeeded();
		await expect(stage).toHaveAttribute("data-playing", "true");
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
