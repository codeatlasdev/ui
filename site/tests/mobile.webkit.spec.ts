import { expect, gotoReady, test } from "./fixtures";

// Runs only in the `iphone` project (WebKit, iPhone 15): iOS viewport, safe areas, zoom-on-focus.

test("app shell fills the viewport and BottomNav keeps a 56px content box", async ({ page }) => {
	await gotoReady(page, "/templates/app/dashboard/");
	const { main, inner } = await page.evaluate(() => ({
		main: document.querySelector(".ca-main")?.getBoundingClientRect().height,
		inner: window.innerHeight,
	}));
	expect(main).toBe(inner);
	const nav = page.locator(".ca-bottom-nav").first();
	await expect(nav).toBeVisible();
	const content = await nav.evaluate((el) => {
		const s = getComputedStyle(el);
		return (
			el.getBoundingClientRect().height -
			Number.parseFloat(s.paddingTop) -
			Number.parseFloat(s.paddingBottom)
		);
	});
	expect(content).toBe(56);
});

test("text-entry controls are at least 16px so iOS does not zoom on focus", async ({ page }) => {
	for (const [path, selector] of [
		["/docs/inputs/text-area/", ".ca-ta__input"],
		["/docs/inputs/text-field/", ".ca-tf__input"],
	] as const) {
		await gotoReady(page, path);
		const field = page.locator(selector).first();
		await field.focus();
		const size = await field.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
		expect(size, `${selector} on ${path}`).toBeGreaterThanOrEqual(16);
	}
});

test("buttons meet the 44px touch target", async ({ page }) => {
	await gotoReady(page, "/templates/app/dashboard/");
	const heights = await page
		.locator(".ca-btn:visible")
		.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
	expect(heights.length).toBeGreaterThan(0);
	for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
});

test("theme-color follows the opaque chrome at the top edge", async ({ page }) => {
	await gotoReady(page, "/templates/app/dashboard/");
	const read = () =>
		page.evaluate(() => {
			const c = document.createElement("canvas").getContext("2d");
			const header = document.querySelector(".ca-mobile-header");
			if (!c || !header) throw new Error("canvas 2d or .ca-mobile-header missing");
			const hex = (v: string) => {
				c.fillStyle = v;
				c.fillRect(0, 0, 1, 1);
				const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
				return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
			};
			return {
				meta: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content,
				header: hex(getComputedStyle(header).backgroundColor),
				html: hex(getComputedStyle(document.documentElement).backgroundColor),
			};
		});
	// Compare both values from the same read: the header color can still be settling.
	await expect
		.poll(async () => {
			const r = await read();
			return r.meta === r.header;
		})
		.toBe(true);
	// Theme switch re-syncs.
	await page.evaluate(() => document.documentElement.classList.toggle("dark"));
	// Compare both values from the same read: the header color can still be settling.
	await expect
		.poll(async () => {
			const r = await read();
			return r.meta === r.header;
		})
		.toBe(true);
});

test("html paints a solid canvas color (overscroll, Safari 26 sampling)", async ({ page }) => {
	await gotoReady(page, "/");
	const { image, color } = await page.evaluate(() => {
		const s = getComputedStyle(document.documentElement);
		return { image: s.backgroundImage, color: s.backgroundColor };
	});
	expect(image).toBe("none");
	expect(color).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
});
