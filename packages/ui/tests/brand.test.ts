import { describe, expect, it } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateBrand, renderMark, resolveBrand } from "../src/lib/brand.js";
import { iconLinks, ogCard } from "../src/lib/seo/index.js";

const MARK =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><!-- note --><path stroke="{{ink}}" d="M2 2h28"/><path fill="{{spark}}" d="M10 10h8v8z"/></svg>';
const theme = {
	presets: [
		{ id: "tokyo", color: "#7aa2f7" as const, colors: { light: { brand: "#34548a" as const } } },
	],
	defaultPreset: "tokyo",
};

describe("resolveBrand", () => {
	it("returns the default preset's literal colors for both schemes", () => {
		const b = resolveBrand(theme);
		expect(b.light.spark).toBe("#34548a");
		for (const c of [b.light, b.dark])
			for (const v of Object.values(c)) expect(v).toMatch(/^#[0-9a-f]{6}$/);
		expect(b.dark.spark).not.toBe(b.light.spark);
	});

	it("follows the preset: amber (default) is not tokyo", () => {
		expect(resolveBrand({}).light.spark).not.toBe(resolveBrand(theme).light.spark);
	});
});

describe("renderMark", () => {
	it("fills both placeholders and drops comments", () => {
		const svg = renderMark(MARK, { ink: "#111111", spark: "#222222" });
		expect(svg).toContain('stroke="#111111"');
		expect(svg).toContain('fill="#222222"');
		expect(svg).not.toContain("{{");
		expect(svg).not.toContain("<!--");
	});

	it("rejects a mark with a literal color or a missing placeholder", () => {
		expect(() =>
			renderMark(MARK.replace('d="M2 2h28"', 'd="M2 2h28" fill="#000"'), { ink: "#1", spark: "#2" })
		).toThrow(/literal colors/);
		expect(() => renderMark("<svg/>", { ink: "#1", spark: "#2" })).toThrow(/placeholders/);
	});
});

describe("generateBrand", () => {
	it("writes the hashed icon set; inputs, not pixels, decide the hash", async () => {
		const run = async (mark: string) => {
			const outDir = mkdtempSync(join(tmpdir(), "brand-"));
			const assets = await generateBrand({ mark, theme, outDir, name: "T" });
			return { assets, outDir };
		};
		const a = await run(MARK);
		const again = await run(MARK);
		const changed = await run(MARK.replace("M2 2h28", "M2 3h28"));
		expect(again.assets.hash).toBe(a.assets.hash);
		expect(changed.assets.hash).not.toBe(a.assets.hash);
		const files = readdirSync(a.outDir).sort();
		expect(files).toEqual(
			[
				`apple-touch-icon.${a.assets.hash}.png`,
				`favicon-32.${a.assets.hash}.png`,
				`favicon.${a.assets.hash}.ico`,
				`favicon.${a.assets.hash}.svg`,
				`icon-192.${a.assets.hash}.png`,
				`icon-512.${a.assets.hash}.png`,
				`manifest.${a.assets.hash}.webmanifest`,
				`maskable-512.${a.assets.hash}.png`,
			].sort()
		);
		const png = readFileSync(join(a.outDir, `apple-touch-icon.${a.assets.hash}.png`));
		expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([180, 180]);
		expect(readFileSync(join(a.outDir, `favicon.${a.assets.hash}.svg`), "utf8")).toContain(
			"#34548a"
		);
	});
});

describe("iconLinks / ogCard", () => {
	it("links only what it is given and escapes attributes", () => {
		const out = iconLinks({ favicon: '/a"b.svg', appleTouch: "/t.png" });
		expect(out).toContain('href="/a&quot;b.svg"');
		expect(out).toContain('rel="apple-touch-icon"');
		expect(out).not.toContain("manifest");
		expect(out).not.toContain('sizes="48x48"');
	});

	it("escapes user text in the card", () => {
		const html = ogCard({
			title: "<script>x</script>",
			siteName: "S",
			mark: "<svg/>",
			colors: { ink: "#111111", spark: "#222222", surface: "#333333" },
		});
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).toContain("1200px");
	});
});
