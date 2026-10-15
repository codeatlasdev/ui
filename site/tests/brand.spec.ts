import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveBrand } from "@codeatlasdev/ui/vite";
import { expect, test } from "@playwright/test";
import { theme } from "../src/theme.ts";
import { DIST, ROUTES } from "./routes";

/**
 * Brand assets: every page ships its own hashed og:image, the favicon follows the theme
 * (never a hand-copied palette), and the head carries the icons a phone or a scraper asks for.
 * Pure file checks on `dist/`; no browser.
 */

const PAGES = ROUTES.filter((r) => r !== "/404/" && r !== "/500/");
const html = (route: string) => readFileSync(join(DIST, route, "index.html"), "utf8");
const attr = (doc: string, tag: string, key: string, val: string, out: string) => {
	const m = doc.match(new RegExp(`<${tag}[^>]*\\b${key}="${val}"[^>]*>`));
	return m?.[0].match(new RegExp(`\\b${out}="([^"]*)"`))?.[1];
};
const meta = (doc: string, prop: string) => attr(doc, "meta", "property", prop, "content");
const file = (url: string) => join(DIST, new URL(url, "https://x.test").pathname);
/** Width and height from the PNG IHDR chunk (bytes 16 to 23). */
const pngSize = (path: string) => {
	const b = readFileSync(path);
	expect(b.subarray(1, 4).toString(), `${path} is not a PNG`).toBe("PNG");
	return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};

test.describe("og:image", () => {
	test("every page has its own hashed, existing 1200x630 PNG", () => {
		const seen = new Map<string, string>();
		for (const route of PAGES) {
			const doc = html(route);
			const url = meta(doc, "og:image");
			expect(url, `${route}: og:image`).toMatch(/^https:\/\/.+\/brand\/og\/.+\.[0-9a-f]{10}\.png$/);
			expect(existsSync(file(url as string)), `${route}: ${url} is missing from dist`).toBe(true);
			expect(pngSize(file(url as string)), route).toEqual({ width: 1200, height: 630 });
			expect(meta(doc, "og:image:type"), route).toBe("image/png");
			expect(meta(doc, "og:image:width"), route).toBe("1200");
			expect(meta(doc, "og:image:height"), route).toBe("630");
			expect(meta(doc, "og:image:alt"), `${route}: og:image:alt`).toBeTruthy();
			expect(attr(doc, "meta", "name", "twitter:image", "content"), `${route}: twitter:image`).toBe(
				url
			);
			const other = seen.get(url as string);
			expect(other, `${route} shares its og:image with ${other}`).toBeUndefined();
			seen.set(url as string, route);
		}
	});
});

test.describe("icons", () => {
	test("head links resolve to the right files", () => {
		const doc = html("/");
		const svg = attr(doc, "link", "rel", "icon", "href");
		expect(svg, "link rel=icon").toMatch(/^\/brand\/favicon\.[0-9a-f]{10}\.svg$/);
		expect(existsSync(file(svg as string))).toBe(true);
		const touch = attr(doc, "link", "rel", "apple-touch-icon", "href");
		expect(touch, "apple-touch-icon").toMatch(/^\/brand\/apple-touch-icon\.[0-9a-f]{10}\.png$/);
		expect(pngSize(file(touch as string))).toEqual({ width: 180, height: 180 });
		const ico = doc.match(
			/<link[^>]*rel="icon"[^>]*href="(\/brand\/favicon\.[0-9a-f]{10}\.ico)"/
		)?.[1];
		expect(ico, "ICO fallback link").toBeTruthy();
		expect(existsSync(file(ico as string))).toBe(true);
		const manifestUrl = attr(doc, "link", "rel", "manifest", "href");
		expect(manifestUrl, "link rel=manifest").toBeTruthy();
		const m = JSON.parse(readFileSync(file(manifestUrl as string), "utf8"));
		for (const icon of m.icons) {
			const [w, h] = icon.sizes.split("x").map(Number);
			expect(pngSize(file(icon.src)), icon.src).toEqual({ width: w, height: h });
		}
		expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
	});

	test("favicon colors come from the theme, not a hand-copied palette", () => {
		const doc = html("/");
		const svg = readFileSync(file(attr(doc, "link", "rel", "icon", "href") as string), "utf8");
		const brand = resolveBrand(theme);
		for (const hex of [brand.light.spark, brand.light.ink, brand.dark.spark, brand.dark.ink])
			expect(svg.toLowerCase(), `favicon lacks ${hex}`).toContain(hex);
		expect(svg).not.toContain("{{");
	});

	test("the mark source has no literal color, so Logo and favicon cannot diverge", () => {
		const mark = readFileSync(join(DIST, "../src/brand/mark.svg"), "utf8");
		expect(mark).toContain("{{ink}}");
		expect(mark).toContain("{{spark}}");
		expect(mark).not.toMatch(/#[0-9a-f]{3,8}\b|oklch\(|rgb\(/i);
	});

	test("generated assets are not committed and old hand-made ones are gone", () => {
		expect(existsSync(join(DIST, "../public/favicon.svg"))).toBe(false);
		expect(existsSync(join(DIST, "../public/og.png"))).toBe(false);
		expect(readdirSync(join(DIST, "brand")).some((f) => f.startsWith("maskable-512."))).toBe(true);
	});
});

test.describe("cache", () => {
	test("_headers marks /brand/* immutable", () => {
		const headers = readFileSync(join(DIST, "_headers"), "utf8");
		expect(headers).toMatch(/\/brand\/\*\s+Cache-Control: public, max-age=31536000, immutable/);
	});
});
