import { expect, networkIdle, test, waitIslands } from "./fixtures";

test.describe("landing", () => {
	test("loads without console or page errors", async ({ page, consoleErrors }) => {
		await page.goto("/");
		await networkIdle(page);
		await waitIslands(page, "astro-island[client='load']");
		expect(consoleErrors).toEqual([]);
	});

	test("hero demo repaints with the picked preset, not the page brand", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await waitIslands(page, "astro-island[client='visible']");
		const brand = (sel: string) =>
			page
				.locator(sel)
				.first()
				.evaluate((el) => getComputedStyle(el).getPropertyValue("--ca-brand-main").trim());
		for (const preset of ["violet", "ocean", "emerald"]) {
			await page
				.getByRole("radiogroup", { name: "Color" })
				.getByRole("radio", { name: preset, exact: true })
				.click();
			await expect(page.locator(".stage")).toHaveAttribute("data-preset", preset);
			// The surface is a scope inside the preset island: it must resolve to the island's preset.
			expect(await brand(".stage__surface")).toBe(await brand(".stage"));
		}
	});

	test("skip link is the first tab stop and focuses #main", async ({ page }) => {
		await page.goto("/");
		await page.keyboard.press("Tab");
		const skip = page.getByRole("link", { name: "Skip to content" });
		await expect(skip).toBeFocused();
		await page.keyboard.press("Enter");
		await expect(page.locator("#main")).toBeFocused();
	});

	test("content painted on the first screen never disappears while motion boots", async ({
		page,
	}) => {
		// Motion boots on idle, after first paint. It may animate what is still below the fold,
		// but must never hide text or actions the reader already sees (blink-out, return later).
		// The suite defaults to reduced motion; this check is about the motion path.
		await page.emulateMedia({ reducedMotion: "no-preference" });
		await page.goto("/", { waitUntil: "commit" });
		const mins: Record<string, number> = {};
		const until = Date.now() + 3000;
		while (Date.now() < until) {
			const sample = await page
				.evaluate(() =>
					Object.fromEntries(
						[...document.querySelectorAll("main h1, main h2, main p, main a, main button")]
							.filter((e) => {
								const r = e.getBoundingClientRect();
								return r.width > 0 && r.top < innerHeight && r.bottom > 0;
							})
							.map((e, i) => {
								let op = 1;
								for (let a: Element | null = e; a; a = a.parentElement)
									op *= Number(getComputedStyle(a).opacity);
								return [`${e.tagName}${i}«${(e.textContent ?? "").trim().slice(0, 24)}»`, op];
							})
					)
				)
				.catch(() => ({}) as Record<string, number>);
			for (const [k, v] of Object.entries(sample)) mins[k] = Math.min(mins[k] ?? 1, v);
			await page.waitForTimeout(40);
		}
		expect(Object.keys(mins).length).toBeGreaterThan(3);
		expect(Object.entries(mins).filter(([, v]) => v < 0.95)).toEqual([]);
	});

	test("reduced motion renders the final headline state", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		await networkIdle(page);
		await expect(page.locator("html")).toHaveClass(/calm/);
		const old = page.locator("[data-old]");
		const next = page.locator("[data-new]");
		await expect(old).toBeVisible();
		await expect(next).toBeVisible();
		// Old phrase struck through (scaleX 1), new phrase fully unclipped, no pending transforms.
		expect(await old.evaluate((el) => getComputedStyle(el, "::after").transform)).toMatch(
			/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/
		);
		expect(await next.evaluate((el) => getComputedStyle(el).clipPath)).toBe("none");
		expect(await next.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
		for (const el of await page.locator("[data-hero-in]").all()) {
			expect(await el.evaluate((n) => getComputedStyle(n).opacity)).toBe("1");
		}
	});

	for (const width of [390, 1440]) {
		test(`no horizontal overflow at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto("/");
			await networkIdle(page);
			// Scroll through so `client:visible` islands (charts, theme lab) mount before measuring.
			await page.evaluate(async () => {
				for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
					scrollTo(0, y);
					await new Promise((r) => setTimeout(r, 60));
				}
				scrollTo(0, 0);
			});
			const { scrollWidth, clientWidth } = await page.evaluate(() => ({
				scrollWidth: document.documentElement.scrollWidth,
				clientWidth: document.documentElement.clientWidth,
			}));
			expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
		});
	}

	test.describe("chapter rail", () => {
		test.use({ viewport: { width: 1440, height: 900 } });
		test.skip(({ isMobile }) => isMobile, "rail is desktop-only");

		for (const id of ["theme", "mobile", "agents", "data", "quality", "start"]) {
			test(`link #${id} scrolls to its section`, async ({ page }) => {
				await page.goto("/");
				await page.waitForFunction(() => document.querySelector("[data-rail]") !== null);
				// The rail only appears once the first chapter is in view.
				await page.locator("#theme").scrollIntoViewIfNeeded();
				await expect(page.locator("html")).toHaveClass(/rail-on/);
				const link = page.locator(`[data-rail="${id}"]`);
				await expect(link).toHaveAttribute("href", `#${id}`);
				await link.click();
				await expect(page).toHaveURL(new RegExp(`#${id}$`));
				const top = () => page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top);
				await expect.poll(async () => Math.abs(await top()), { timeout: 5_000 }).toBeLessThan(200);
			});
		}
	});
});
