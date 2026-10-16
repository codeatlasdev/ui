import type { Locator } from "@playwright/test";
import { expect, test, waitIslands } from "./fixtures";

test.describe("landing", () => {
	test("loads without console or page errors", async ({ page, consoleErrors }) => {
		await page.goto("/");
		await waitIslands(page, "astro-island[client='load']");
		expect(consoleErrors).toEqual([]);
	});

	test("hero demo repaints with the picked preset, not the page brand", async ({ page }) => {
		await page.goto("/");
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

	test("hero prompt: Copy writes exactly the prompt text", async ({ page, context }) => {
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);
		await page.goto("/");
		await waitIslands(page, "astro-island[client='load']");
		const shown = (await page.locator("pre.hero__prompt").textContent()) ?? "";
		expect(shown).toContain("npx -y -p @codeatlasdev/ui ca-ui-mcp");
		expect(shown).toContain("migrate-react");
		expect(shown).toContain("report_issue");
		await page.getByRole("button", { name: "Copy prompt" }).click();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shown);
		// The same text is what /prompt.txt serves (agents can fetch it by URL).
		const served = await (await page.request.get("/prompt.txt")).text();
		expect(served.trim()).toBe(shown);
	});

	// viewport_complete §3: headline, one-sentence promise, the start of the prompt and the primary
	// action share the first viewport on a phone, in both orientations and on desktop.
	for (const vp of [
		{ width: 360, height: 640 },
		{ width: 390, height: 844 },
		{ width: 844, height: 390 },
		{ width: 1440, height: 900 },
	]) {
		test(`hero first viewport holds title, prompt and Copy at ${vp.width}x${vp.height}`, async ({
			page,
			isMobile,
		}) => {
			test.skip(isMobile, "viewport is set explicitly, desktop project only");
			await page.setViewportSize(vp);
			await page.goto("/");
			await waitIslands(page, "astro-island[client='load']");
			const inView = async (loc: Locator) => {
				const box = await loc.boundingBox();
				expect(box).not.toBeNull();
				return box!.y >= 0 && box!.y + box!.height <= vp.height;
			};
			expect(await inView(page.locator("h1#hero-h"))).toBe(true);
			expect(await inView(page.locator(".hero__lead"))).toBe(true);
			expect(await inView(page.getByRole("button", { name: "Copy prompt" }))).toBe(true);
			// The prompt box starts inside the viewport (it may scroll or run past the fold).
			const prompt = await page.locator("pre.hero__prompt").boundingBox();
			expect(prompt!.y).toBeLessThan(vp.height);
			expect(prompt!.height).toBeGreaterThan(0);
		});
	}

	test("hero prompt box is keyboard-scrollable when it overflows", async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 640 });
		await page.goto("/");
		await waitIslands(page, "astro-island[client='load']");
		const pre = page.locator("pre.hero__prompt");
		const overflows = await pre.evaluate((el) => el.scrollHeight > el.clientHeight);
		if (overflows) await expect(pre).toHaveAttribute("tabindex", "0");
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
			// Hydrates every island (`client:visible` ones are scrolled into view) before measuring.
			await waitIslands(page);
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

		for (const id of ["pick", "agents", "theme", "mobile", "data", "start"]) {
			test(`link #${id} scrolls to its section`, async ({ page }) => {
				await page.goto("/");
				await page.waitForFunction(() => document.querySelector("[data-rail]") !== null);
				// The rail only appears once the first chapter has scrolled up into the top of the viewport.
				await page.locator("#pick").evaluate((el) => el.scrollIntoView({ block: "start" }));
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
