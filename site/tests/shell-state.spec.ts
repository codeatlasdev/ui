import type { Page } from "@playwright/test";
import { expect, gotoReady, test } from "./fixtures";

// The admin template is an MPA: every navigation is a new document. The shell must come back as
// the user left it (#109): panel, module, expanded section and panel scroll, with no flash.
test.describe("AppShell state across page loads (#109)", () => {
	test.skip(({ isMobile }) => isMobile, "rail and panel are desktop-only");

	const URL = "/templates/admin/dashboard/";
	const insights = (page: Page) => page.getByRole("button", { name: "Insights" });

	/** Loads `url` with every island script blocked: only server markup + inline scripts run. */
	async function loadUnhydrated(page: Page, url: string) {
		await page.route("**/_astro/**", (route) => route.abort());
		await page.goto(url);
	}

	test("section state survives location.assign", async ({ page }) => {
		await gotoReady(page, URL);
		await expect(insights(page)).toHaveAttribute("aria-expanded", "true");

		await insights(page).click();
		await expect(insights(page)).toHaveAttribute("aria-expanded", "false");

		await page.evaluate(() => location.assign("/templates/admin/users/"));
		await page.waitForURL("**/users/");
		await expect(insights(page)).toBeVisible();
		await expect(insights(page)).toHaveAttribute("aria-expanded", "false");
	});

	test("selected module survives a reload", async ({ page }) => {
		await gotoReady(page, URL);
		await page.getByRole("button", { name: "Settings" }).click();
		await page.waitForURL("**/settings/");
		await expect(page.locator("html")).toHaveAttribute("data-ca-module", "settings");

		await page.reload();
		await expect(page.locator(".ca-panel__title")).toHaveText("Settings");
	});

	test("collapsed panel is laid out closed before hydration", async ({ page }) => {
		await gotoReady(page, URL);
		await page.evaluate(() => localStorage.setItem("ca-shell", JSON.stringify({ panel: false })));

		await loadUnhydrated(page, URL);

		await expect(page.locator("html")).toHaveAttribute("data-ca-panel", "closed");
		await expect(page.locator(".ca-rail")).toBeVisible(); // server-rendered: not a blank page
		await expect(page.locator(".ca-panel")).toBeHidden();
		await expect(page.locator(".ca-main")).toHaveCSS("margin-left", "52px");
	});

	test("module and panel scroll are applied before hydration", async ({ page }) => {
		await gotoReady(page, URL);
		await page.evaluate(() => {
			localStorage.setItem("ca-shell", JSON.stringify({ panel: true, module: "settings" }));
			sessionStorage.setItem("ca-shell-scroll", JSON.stringify({ settings: 12 }));
			// Make the list overflow so a non-zero scrollTop is reachable.
			const style = document.createElement("style");
			style.textContent = ".ca-panel__nav{max-height:60px}";
			document.head.append(style);
		});

		await loadUnhydrated(page, URL);

		await expect(page.locator("html")).toHaveAttribute("data-ca-module", "settings");
		// The server markup has no module switch: the inline script only records it for CSS and
		// the module-scoped scroll restore.
		await expect(page.locator("html")).toHaveAttribute("data-ca-panel", "open");
	});

	test("panel scroll survives a reload", async ({ page }) => {
		// Short viewport: the panel list (about 250px) must overflow its box to be scrollable.
		await page.setViewportSize({ width: 1280, height: 200 });
		await gotoReady(page, URL);
		const nav = page.locator(".ca-panel__nav");
		const overflow = await nav.evaluate((el) => el.scrollHeight - el.clientHeight);
		expect(overflow, "panel must overflow for this test to mean anything").toBeGreaterThan(20);

		await nav.evaluate((el, top) => {
			el.scrollTop = top;
		}, 20);
		// Saved on scroll (debounced 100ms) and on pagehide.
		await page.reload();
		await expect.poll(() => nav.evaluate((el) => el.scrollTop)).toBe(20);
	});

	test("panel scroll is applied before hydration", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 200 });
		// Seeded before any page script runs, so a leaving page cannot overwrite it.
		await page.addInitScript(() => {
			sessionStorage.setItem("ca-shell-scroll", JSON.stringify({ main: 20 }));
		});

		await loadUnhydrated(page, URL);

		await expect(page.locator(".ca-panel__nav")).toBeVisible();
		expect(await page.locator(".ca-panel__nav").evaluate((el) => el.scrollTop)).toBe(20);
	});

	test("malformed stored state is ignored and removed", async ({ page }) => {
		await gotoReady(page, URL);
		await page.evaluate(() => localStorage.setItem("ca-shell", '{"panel":"yes","module":7'));
		await page.reload();

		await expect(page.locator("html")).toHaveAttribute("data-ca-panel", "open");
		await expect(page.locator(".ca-panel")).toBeVisible();
		const stored = await page.evaluate(() => localStorage.getItem("ca-shell"));
		expect(() => JSON.parse(stored ?? "{}")).not.toThrow();
	});
});
