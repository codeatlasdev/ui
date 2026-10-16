import { describe, expect, it, spyOn } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runBrandCommand } from "../src/cli/brand.ts";
import {
	brandUrls,
	caBrandPlugin,
	generateBrand,
	renderMark,
	resolveBrand,
	resvgOptions,
} from "../src/lib/brand.js";
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

describe("generated web app manifest (#206)", () => {
	const manifestOf = async (t: typeof theme & { defaultScheme?: "light" | "dark" | "system" }) => {
		const outDir = mkdtempSync(join(tmpdir(), "brand-"));
		const assets = await generateBrand({ mark: MARK, theme: t, outDir, name: "Tokyo App" });
		return JSON.parse(readFileSync(join(outDir, `manifest.${assets.hash}.webmanifest`), "utf8"));
	};

	it("is installable: standalone, with a stable id and a scope", async () => {
		const m = await manifestOf(theme);
		expect(m.display).toBe("standalone");
		expect(m.id).toBe("/");
		expect(m.scope).toBe("/");
		expect(m.start_url).toBe("/");
	});

	it("takes theme and background colors from the default scheme", async () => {
		const brand = resolveBrand(theme);
		const dark = await manifestOf({ ...theme, defaultScheme: "dark" });
		expect(dark.theme_color).toBe(brand.dark.surface);
		expect(dark.background_color).toBe(brand.dark.surface);
		const light = await manifestOf({ ...theme, defaultScheme: "light" });
		expect(light.theme_color).toBe(brand.light.surface);
		expect(light.background_color).toBe(brand.light.surface);
		expect(brand.dark.surface).not.toBe(brand.light.surface);
	});

	it("`system` (what init scaffolds) counts as dark, like manifest(), and renames the icons only when the color changes", async () => {
		const brand = resolveBrand(theme);
		const system = await manifestOf({ ...theme, defaultScheme: "system" });
		expect(system.theme_color).toBe(brand.dark.surface);
		const url = (s: "light" | "dark" | "system") =>
			brandUrls({ mark: MARK, theme: { ...theme, defaultScheme: s }, name: "Tokyo App" }).hash;
		expect(url("system")).toBe(url("dark"));
		expect(url("light")).not.toBe(url("dark"));
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

	it("sets the document language from `lang`, default en, escaped (#144)", () => {
		const base = {
			title: "Manda. Chega.",
			siteName: "S",
			mark: "<svg/>",
			colors: { ink: "#111111", spark: "#222222", surface: "#333333" },
		};
		expect(ogCard(base)).toContain('<html lang="en">');
		expect(ogCard({ ...base, lang: "pt-BR" })).toContain('<html lang="pt-BR">');
		expect(ogCard({ ...base, lang: 'x"><script>' })).not.toContain("<script>");
	});
});

describe("resvgOptions", () => {
	// resvg loads every system font per render by default: ~450 ms each on Windows, so one icon set
	// took ~2.7 s and the generateBrand test timed out there (#120). A mark without text needs none.
	it("loads system fonts only for an SVG with text (#120)", () => {
		expect(resvgOptions(MARK, 32).font?.loadSystemFonts).toBe(false);
		const withText = MARK.replace("</svg>", '<text x="4" y="20">A</text></svg>');
		expect(resvgOptions(withText, 32).font?.loadSystemFonts).toBe(true);
		expect(resvgOptions(MARK, 180).fitTo).toEqual({ mode: "width", value: 180 });
	});
});

describe("recipes from the Node-safe vite entry (#148)", () => {
	it("exports designStyle, DESIGN_STYLES and mergeTheme", async () => {
		const vite = await import("../src/lib/vite-plugin.js");
		expect(typeof vite.designStyle).toBe("function");
		expect(Object.keys(vite.DESIGN_STYLES)).toContain("liquid");
		expect(vite.designStyle("liquid", { defaultPreset: "x" }).defaultPreset).toBe("x");
		expect(typeof vite.mergeTheme).toBe("function");
	});

	it("is the entry the theming guide and init tell users to import from", () => {
		const theming = readFileSync(
			join(import.meta.dir, "../../../site/src/content/docs/getting-started/theming.mdx"),
			"utf8"
		);
		expect(theming).toContain('import { designStyle } from "@codeatlasdev/ui/vite";');
		expect(theming).not.toContain('import { designStyle } from "@codeatlasdev/ui/astro";');
		const init = readFileSync(join(import.meta.dir, "../src/cli/init.ts"), "utf8");
		expect(init).toContain("designStyle");
		expect(init).toContain("@codeatlasdev/ui/vite");
	});
});

describe("brand module on a fresh clone (#141)", () => {
	const project = (files: Record<string, string>) => {
		const root = mkdtempSync(join(tmpdir(), "brand-proj-"));
		for (const [path, content] of Object.entries(files)) {
			mkdirSync(dirname(join(root, path)), { recursive: true });
			writeFileSync(join(root, path), content);
		}
		return root;
	};

	it("brandUrls returns the URLs generateBrand writes, without rendering", async () => {
		const o = { mark: MARK, theme, name: "T" };
		const urls = brandUrls(o);
		const assets = await generateBrand({ ...o, outDir: mkdtempSync(join(tmpdir(), "brand-")) });
		expect(urls).toEqual(assets);
	});

	it("caBrandPlugin writes src/generated/brand.ts at configResolved, before any build", () => {
		const root = project({ "src/brand/mark.svg": MARK });
		const plugin = caBrandPlugin({ theme, name: "T" });
		(plugin.configResolved as (c: { root: string }) => void)({ root });
		const mod = readFileSync(join(root, "src/generated/brand.ts"), "utf8");
		expect(mod).toContain("export const brand =");
		expect(mod).toContain(brandUrls({ mark: MARK, theme, name: "T" }).favicon);
		expect(existsSync(join(root, "static/brand"))).toBe(false);
	});

	it("caBrandPlugin leaves the module alone when there is no mark", () => {
		const root = project({});
		const warn = spyOn(console, "warn").mockImplementation(() => {});
		(caBrandPlugin().configResolved as (c: { root: string }) => void)({ root });
		warn.mockRestore();
		expect(existsSync(join(root, "src/generated/brand.ts"))).toBe(false);
	});

	it("the brand CLI renders the icons and the module from a theme file", async () => {
		const root = project({
			"src/brand/mark.svg": MARK,
			"src/lib/theme.js": `export const theme = ${JSON.stringify(theme)};`,
		});
		const code = await runBrandCommand(root, {
			theme: "src/lib/theme.js",
			name: "T",
			log: () => {},
		});
		expect(code).toBe(0);
		const mod = readFileSync(join(root, "src/generated/brand.ts"), "utf8");
		const { hash } = brandUrls({ mark: MARK, theme, name: "T" });
		expect(mod).toContain(hash);
		expect(readdirSync(join(root, "static/brand"))).toContain(`favicon.${hash}.svg`);
	});

	it("the brand CLI fails clearly when the mark is missing", async () => {
		const root = project({});
		expect(await runBrandCommand(root, { log: () => {} })).toBe(1);
	});
});
