import type { Page } from "@playwright/test";
import { expect, networkIdle, test, waitIslands } from "./fixtures";

/**
 * Theme chapter ("One hex in, a whole theme out"): changing the preview must never move the page.
 * Regressions this guards (#122): focusing the brand-color field grew the code snippet by a line,
 * which re-centered the copy column and let scroll anchoring nudge `scrollY`; and every swatch
 * had an oversized, overlapping hit area so clicks landed on the neighbouring swatch.
 */
test.describe("theme lab stays put", () => {
	test.use({ viewport: { width: 1440, height: 900 } });
	test.skip(({ isMobile }) => isMobile, "desktop split layout");

	async function openLab(page: Page) {
		await page.goto("/");
		await networkIdle(page);
		await waitIslands(page);
		await page.evaluate(() => {
			const top = document.querySelector(".lab")?.getBoundingClientRect().top ?? 0;
			scrollTo(0, scrollY + top - 80);
		});
		// Lenis may still be easing; wait for scroll to settle before measuring.
		await expect
			.poll(async () => {
				const a = await page.evaluate(() => scrollY);
				await page.waitForTimeout(150);
				return a === (await page.evaluate(() => scrollY));
			})
			.toBe(true);
	}

	const metrics = (page: Page) =>
		page.evaluate(() => ({
			y: Math.round(scrollY * 10) / 10,
			docH: document.documentElement.scrollHeight,
			copyTop: Math.round(
				(document.querySelector("#theme .chapter__copy")?.getBoundingClientRect().top ?? 0) +
					scrollY
			),
			labH: Math.round(document.querySelector(".lab")?.getBoundingClientRect().height ?? 0),
		}));

	test("switching style, swatch, scheme and brand color keeps scroll and layout", async ({
		page,
	}) => {
		await openLab(page);
		const before = await metrics(page);

		const lab = page.locator(".lab");
		for (const style of ["frosted", "solid", "flat", "glass"]) {
			await lab.getByRole("radio", { name: style }).click();
		}
		for (const preset of ["violet", "emerald", "rose"]) {
			await lab.getByRole("radio", { name: preset, exact: true }).click();
		}
		await lab.getByRole("switch", { name: "Dark" }).click();
		await lab.getByRole("switch", { name: "Dark" }).click();
		// Entering brand mode (focus + typing) is what grew the snippet.
		await lab.getByLabel("Brand color").click();
		await page.keyboard.press("ControlOrMeta+a");
		await page.keyboard.type("#3b82f6");
		await page.waitForTimeout(300);

		expect(await metrics(page)).toEqual(before);
	});

	test("every swatch receives its own click", async ({ page }) => {
		await openLab(page);
		const hit = await page.evaluate(() =>
			[...document.querySelectorAll<HTMLElement>(".lab .ca-swatch")].map((d) => {
				const r = d.getBoundingClientRect();
				const at = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
				return [d.dataset.preset, at?.closest<HTMLElement>(".ca-swatch")?.dataset.preset ?? null];
			})
		);
		expect(hit.filter(([want, got]) => want !== got)).toEqual([]);
	});

	test("layout shift score stays zero while the preview changes", async ({ page }) => {
		await openLab(page);
		await page.evaluate(() => {
			const w = window as Window & { __cls?: number };
			w.__cls = 0;
			new PerformanceObserver((list) => {
				for (const e of list.getEntries())
					w.__cls = (w.__cls ?? 0) + (e as PerformanceEntry & { value: number }).value;
			}).observe({ type: "layout-shift" });
		});
		const lab = page.locator(".lab");
		await lab.getByRole("radio", { name: "solid" }).click();
		await lab.getByRole("radio", { name: "violet", exact: true }).click();
		await lab.getByLabel("Brand color").click();
		await page.keyboard.type("1");
		await page.waitForTimeout(400);
		expect(await page.evaluate(() => (window as Window & { __cls?: number }).__cls)).toBe(0);
	});
});
