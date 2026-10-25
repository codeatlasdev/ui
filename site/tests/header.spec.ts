import { expect, gotoReady, test } from "./fixtures";

// One header for the whole site: the bar must not move, resize or change content between pages.
const ROUTES = ["/", "/templates/", "/docs/", "/changelog/", "/gallery/"];

interface Measure {
	bar: { x: number; y: number; width: number; height: number };
	brand: { x: number; y: number; width: number; height: number };
	nav: { text: string; x: number; width: number; current: boolean }[];
	actions: string[];
	opaque: boolean;
}

async function measure(page: import("@playwright/test").Page): Promise<Measure> {
	return page.evaluate(() => {
		const r = (el: Element) => {
			const b = el.getBoundingClientRect();
			return { x: b.x, y: b.y, width: b.width, height: b.height };
		};
		const header = document.querySelector<HTMLElement>("header.ca-docs-header");
		if (!header) throw new Error("no .ca-docs-header on the page");
		const brand = header.querySelector(".ca-docs-brand");
		if (!brand) throw new Error("no brand link");
		const nav = [...header.querySelectorAll<HTMLElement>(".ca-docs-section")]
			.filter((a) => a.offsetParent)
			.map((a) => ({
				text: a.textContent?.trim() ?? "",
				x: a.getBoundingClientRect().x,
				width: a.getBoundingClientRect().width,
				current: a.getAttribute("aria-current") === "page",
			}));
		const actions = [
			...header.querySelectorAll<HTMLElement>(
				".ca-docs-search-btn, .ca-docs-search-icon, .ca-docs-menu, .ca-docs-actions a, .ca-docs-theme"
			),
		]
			.filter((el) => el.offsetParent)
			.map((el) => el.getAttribute("aria-label") ?? el.className.split(" ")[0] ?? "");
		const bg = getComputedStyle(header).backgroundColor;
		return {
			bar: r(header),
			brand: r(brand),
			nav,
			actions,
			opaque: !/\/|rgba/.test(bg),
		};
	});
}

for (const [name, width, height] of [
	["1280", 1280, 800],
	["390", 390, 844],
] as const) {
	test.describe(`site header at ${name}`, () => {
		test.use({ viewport: { width, height } });

		test(`same box, brand, nav and actions on ${ROUTES.join(" ")}`, async ({ page }, info) => {
			test.skip(info.project.name !== "desktop", "viewport is set by the test itself");
			const seen: Record<string, Measure> = {};
			for (const route of ROUTES) {
				await gotoReady(page, route);
				seen[route] = await measure(page);
			}
			const [first, ...rest] = ROUTES;
			const ref = seen[first as string] as Measure;
			expect(ref.opaque).toBe(true);
			// search, GitHub, theme (plus the menu button on a phone, where the search is an icon).
			expect(ref.actions).toHaveLength(width >= 1200 ? 3 : 4);
			if (width >= 1200)
				expect(ref.nav.map((n) => n.text)).toEqual([
					"Docs",
					"Gallery",
					"Templates",
					"Theme editor",
					"Changelog",
				]);
			for (const route of rest) {
				const m = seen[route] as Measure;
				expect(m.bar, `bar ${route}`).toEqual(ref.bar);
				expect(m.brand, `brand ${route}`).toEqual(ref.brand);
				expect(m.actions, `actions ${route}`).toEqual(ref.actions);
				expect(
					m.nav.map(({ text, x, width: w }) => ({ text, x, w })),
					`nav ${route}`
				).toEqual(ref.nav.map(({ text, x, width: w }) => ({ text, x, w })));
				expect(m.opaque, `opaque ${route}`).toBe(true);
			}
		});
	});
}

test("the current section is underlined on its own page and nowhere else", async ({
	page,
}, info) => {
	test.skip(info.project.name !== "desktop", "one run is enough");
	await page.setViewportSize({ width: 1280, height: 800 });
	const current: [string, string][] = [
		["/templates/", "Templates"],
		["/docs/", "Docs"],
		["/changelog/", "Changelog"],
		["/gallery/", "Gallery"],
	];
	for (const [route, label] of current) {
		await gotoReady(page, route);
		const m = await measure(page);
		expect(m.nav.filter((n) => n.current).map((n) => n.text)).toEqual([label]);
	}
	await gotoReady(page, "/");
	expect((await measure(page)).nav.some((n) => n.current)).toBe(false);
});

test("content scrolled under the header never shows through it", async ({ page }, info) => {
	test.skip(info.project.name !== "desktop", "one run is enough");
	await page.setViewportSize({ width: 1280, height: 800 });
	await gotoReady(page, "/gallery/");
	await page.evaluate(() => window.scrollTo(0, 1500));
	const alpha = await page.evaluate(() => {
		const h = document.querySelector("header.ca-docs-header") as HTMLElement;
		const cs = getComputedStyle(h);
		return { bg: cs.backgroundColor, filter: cs.backdropFilter };
	});
	expect(alpha.bg).not.toMatch(/\/|rgba/);
	expect(["none", ""]).toContain(alpha.filter);
});
