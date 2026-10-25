import type { Page } from "@playwright/test";
import { expect, expectNoViolations, gotoReady, makeAxe, test } from "./fixtures";

const SITE_KEY = "ca-site-studio";
const IDS = ["swiss", "editorial", "brutalism", "sketchbook", "glassmorphism", "terminal"] as const;

const px = (page: Page, sel: string, prop: string) =>
	page
		.locator(sel)
		.first()
		.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test.describe("design styles (#583)", () => {
	test("/styles/ lists the six styles and each link opens its page", async ({ page }) => {
		await gotoReady(page, "/styles/");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		for (const id of IDS)
			await expect(page.locator(`main a[href="/styles/${id}/"]`)).toHaveCount(1);
		await page.locator('main a[href="/styles/brutalism/"]').click();
		await expect(page).toHaveURL(/\/styles\/brutalism\/$/);
		await expect(page.getByRole("heading", { level: 1, name: "Brutalism" })).toBeVisible();
	});

	test("the page is rendered in its style while the site header keeps the site's own", async ({
		page,
	}) => {
		await gotoReady(page, "/styles/brutalism/");
		const frame = ".sx-frame";
		// Brutalism: 3px strokes, square corners, hard shadow, uppercase 900 headings, in the page...
		expect(await px(page, frame, "--ca-border-width")).toBe("3px");
		expect(await px(page, frame, "--ca-radius-scale")).toBe("0");
		expect(await px(page, `${frame} h1`, "text-transform")).toBe("uppercase");
		expect(await px(page, `${frame} h1`, "font-weight")).toBe("900");
		// ...and the header above it still wears the sketchbook knobs of the site (2px strokes).
		expect(await px(page, "header.ca-docs-header", "--ca-border-width")).toBe("2px");
	});

	for (const id of IDS) {
		test(`/styles/${id}/ has every section, an h1 and one main`, async ({ page }) => {
			await gotoReady(page, `/styles/${id}/`);
			await expect(page.locator("main#main")).toHaveCount(1);
			await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
			for (const h of [
				"Where it comes from",
				"Traits",
				"Before and after, on real components",
				"Do and don't",
				"Accessibility pitfalls",
				"Components that fit",
				"The ThemeOptions recipe",
				"Prompt for your AI",
				"Limits",
				"References",
			])
				await expect(page.getByRole("heading", { level: 2, name: h })).toBeVisible();
			await expect(page.getByText(`designStyle("${id}")`).first()).toBeVisible();
		});
	}

	test("before and after change real computed styles on the same components", async ({ page }) => {
		await gotoReady(page, "/styles/brutalism/");
		const after = '[data-testid="sc-after"]';
		const before = '[data-testid="sc-before"]';
		await expect(page.locator(after)).toBeVisible();
		await expect(page.locator(before)).toHaveCount(0);

		const afterBtn = `${after} button:has-text("Save")`;
		const afterRadius = await px(page, afterBtn, "border-top-left-radius");
		const afterWidth = await px(page, after, "--ca-border-width");
		expect(afterWidth).toBe("3px");
		expect(afterRadius).toBe("0px");

		await page.getByRole("radio", { name: "Side by side" }).click();
		await expect(page.locator(before)).toBeVisible();
		await expect(page.locator(after)).toBeVisible();
		const beforeBtn = `${before} button:has-text("Save")`;
		// The package default inside a brutalist page: 1px strokes, rounded controls.
		expect(await px(page, before, "--ca-border-width")).toBe("1px");
		expect(await px(page, beforeBtn, "border-top-left-radius")).not.toBe("0px");
		// The same markup on both sides.
		expect(await page.locator(`${before} button`).count()).toBe(
			await page.locator(`${after} button`).count()
		);
	});

	test("Before shows the package default and the toggle is keyboard operable", async ({ page }) => {
		await gotoReady(page, "/styles/swiss/");
		await page.getByRole("radio", { name: "Before", exact: true }).focus();
		await page.keyboard.press("Space");
		await expect(page.locator('[data-testid="sc-before"]')).toBeVisible();
		await expect(page.locator('[data-testid="sc-after"]')).toHaveCount(0);
		expect(await px(page, '[data-testid="sc-before"]', "--ca-radius-scale")).toBe("0.8");
	});

	test("the recipe is copyable and is exactly designStyle(id)", async ({ page }) => {
		await gotoReady(page, "/styles/terminal/");
		const recipe = page.locator("main").getByText('designStyle("terminal")').first();
		await expect(recipe).toBeVisible();
		await expect(page.getByText("import { designStyle, type ThemeOptions }").first()).toBeVisible();
	});

	test("Apply to this site writes only the visitor-only key and Reset removes it", async ({
		page,
	}) => {
		await gotoReady(page, "/styles/editorial/");
		const ls = (k: string) => page.evaluate((key) => localStorage.getItem(key), k);
		expect(await ls(SITE_KEY)).toBeNull();
		const published = await page.evaluate(() =>
			document.documentElement.getAttribute("data-style")
		);

		await page.getByRole("button", { name: "Apply to this site" }).click();
		const stored = JSON.parse((await ls(SITE_KEY)) ?? "null");
		expect(stored.v).toBe(1);
		expect(stored.code).toBe("style:editorial");
		expect(stored.css).toContain("--ca-font-scale: 1.06;");
		// The whole page now wears it, and the visitor's own scheme was not touched.
		expect(await px(page, "html", "--ca-font-scale")).toBe("1.06");
		expect(await ls("ca-scheme")).not.toContain("editorial");

		// It survives a reload before first paint (the inline boot script replays it).
		await page.reload();
		expect(await px(page, "html", "--ca-font-scale")).toBe("1.06");

		await gotoReady(page, "/styles/editorial/");
		await page.getByRole("button", { name: "Reset the site" }).click();
		expect(await ls(SITE_KEY)).toBeNull();
		expect(await px(page, "html", "--ca-font-scale")).not.toBe("1.06");
		expect(await page.evaluate(() => document.documentElement.getAttribute("data-style"))).toBe(
			published
		);
	});

	test("the published default is never changed by applying", async ({ page, request }) => {
		const before = await (await request.get("/styles/swiss/")).text();
		await gotoReady(page, "/styles/swiss/");
		await page.getByRole("button", { name: "Apply to this site" }).click();
		const after = await (await request.get("/styles/swiss/")).text();
		expect(after).toBe(before);
	});

	test("the agent twins exist: digest, one file per style", async ({ request }) => {
		const digest = await request.get("/llms/styles.txt");
		expect(digest.ok()).toBe(true);
		const text = await digest.text();
		for (const id of IDS) {
			expect(text).toContain(`/llms/styles/${id}.txt`);
			const one = await request.get(`/llms/styles/${id}.txt`);
			expect(one.ok()).toBe(true);
			expect(await one.text()).toContain(`designStyle("${id}")`);
		}
		const llms = await (await request.get("/llms.txt")).text();
		expect(llms).toContain("/llms/styles.txt");
	});

	for (const id of IDS) {
		test(`/styles/${id}/ has no axe violations in light and dark`, async ({ page }, testInfo) => {
			await gotoReady(page, `/styles/${id}/`);
			// CodeSnippet shows a raw <pre> until shiki resolves; axe must see the final highlighted block.
			await page.waitForFunction(
				() => !document.querySelector(".ca-code-snippet__pre--raw:not(details:not([open]) *)")
			);
			for (const scheme of ["Light", "Dark"]) {
				await page.getByRole("radio", { name: scheme, exact: true }).click();
				await expectNoViolations(await makeAxe(page).analyze(), testInfo, `${id}-${scheme}`);
			}
		});
	}
});
