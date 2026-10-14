import { theme } from "../src/theme";
import { expect, gotoReady, test } from "./fixtures";

test.describe("theme", () => {
	test.skip(({ isMobile }) => isMobile, "desktop-only");

	test("ThemeToggle flips .dark and persists ca-scheme", async ({ page }) => {
		await gotoReady(page, "/docs/inputs/theme-toggle/");
		const html = page.locator("html");
		await expect(html).toHaveClass(/dark/);
		await page
			.getByRole("button", { name: /color scheme|tema|theme/i })
			.first()
			.click();
		await expect(html).not.toHaveClass(/dark/);
		expect(await page.evaluate(() => localStorage.getItem("ca-scheme"))).toBe('"light"');
	});

	test("preset from localStorage is applied before paint", async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem("ca-preset", JSON.stringify("ocean")));
		await gotoReady(page, "/");
		await expect(page.locator("html")).toHaveAttribute("data-preset", "ocean");
	});

	test.describe("before any app JS runs", () => {
		// Block every script file: only the inline init script can have applied the theme.
		test.beforeEach(({ page }) => page.route("**/*.js", (r) => r.abort()));

		test.describe("stored flat style", () => {
			test.use({ theme: { scheme: "dark", style: "flat" } });
			test("paints the flat background", async ({ page }) => {
				await page.goto("/");
				const html = page.locator("html");
				await expect(html).toHaveAttribute("data-style", "flat");
				const bg = await html.evaluate((el) => getComputedStyle(el).backgroundImage);
				expect(bg).toBe("none");
			});
		});

		test("unknown stored preset falls back to the default and is removed", async ({ page }) => {
			// Seed once: an init script re-runs on every document and would re-write the key after
			// the inline theme script has removed it.
			await page.addInitScript(() => {
				if (!sessionStorage.getItem("seeded")) {
					sessionStorage.setItem("seeded", "1");
					localStorage.setItem("ca-preset", '"amber-old"');
				}
			});
			await page.goto("/");
			await expect(page.locator("html")).toHaveAttribute(
				"data-preset",
				theme.defaultPreset ?? "amber"
			);
			expect(await page.evaluate(() => localStorage.getItem("ca-preset"))).toBeNull();
		});

		test.describe("system scheme", () => {
			test.use({ theme: { scheme: "system" } });
			test("follows the OS and sets theme-color", async ({ page }) => {
				await page.emulateMedia({ colorScheme: "light" });
				await page.goto("/");
				const html = page.locator("html");
				await expect(html).not.toHaveClass(/dark/);
				const light = await page.locator('meta[name="theme-color"]').getAttribute("content");
				await page.emulateMedia({ colorScheme: "dark" });
				await expect(html).toHaveClass(/dark/);
				const dark = await page.locator('meta[name="theme-color"]').getAttribute("content");
				expect(light).toMatch(/^#[0-9a-f]{6}$/);
				expect(dark).not.toBe(light);
			});
		});
	});

	test("/theme editor restyles only its preview, never the page", async ({ page, isMobile }) => {
		await gotoReady(page, "/theme/");
		if (isMobile) await page.getByRole("tab", { name: "Controls" }).click();
		const island = page.getByTestId("te-island");
		const brand = () =>
			island.evaluate((e) => getComputedStyle(e).getPropertyValue("--ca-brand-main").trim());
		const pageBefore = await page.locator("html").getAttribute("data-preset");
		const pageBrand = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue("--ca-brand-main").trim()
		);
		const before = await brand();
		await page
			.getByRole("button", { name: /^(Ocean|Crimson|Violet|Emerald)$/ })
			.first()
			.click();
		await expect.poll(brand).not.toBe(before);
		expect(await page.locator("html").getAttribute("data-preset")).toBe(pageBefore);
		expect(
			await page.evaluate(() =>
				getComputedStyle(document.documentElement).getPropertyValue("--ca-brand-main").trim()
			)
		).toBe(pageBrand);
	});

	test("reducedMotion disables SegmentedControl thumb transition", async ({ page }) => {
		await gotoReady(page, "/docs/inputs/segmented-control/");
		const thumb = page.locator(".ca-seg__thumb, [class*='seg'][class*='thumb']").first();
		await expect(thumb).toBeAttached();
		// Reduced motion collapses transitions to ~0 (1µs, so transitionend still fires).
		const seconds = await thumb.evaluate((el) =>
			Number.parseFloat(getComputedStyle(el).transitionDuration)
		);
		expect(seconds).toBeLessThan(0.001);
	});
});
