/**
 * Brand assets from one mark: `@codeatlasdev/ui/vite` (`caBrandPlugin`, `generateBrand`).
 *
 * A mark is an SVG with two placeholders, `{{ink}}` (outline color) and `{{spark}}` (accent), and no
 * literal color. Every consumer substitutes them: the in-page logo with `var(--ca-*)`, the favicon
 * and icons with sRGB hex resolved from the theme. A color change in the theme therefore reaches
 * the browser tab, the home-screen icon and the social card without anyone redrawing anything.
 *
 * Output names carry a hash of the *inputs* (mark, resolved colors, sizes), never of the rendered
 * bytes: rasterizers differ between machines, inputs do not. A changed input renames the file, so
 * `/brand/*` can be served `immutable`.
 *
 * `@resvg/resvg-js` (PNG) and `png-to-ico` (ICO) are optional peers, imported only when
 * `generateBrand` runs.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type * as ResvgModule from "@resvg/resvg-js";
import type * as PngToIcoModule from "png-to-ico";
import type { Plugin } from "vite";
import { defaultPresetTokens, defineTheme } from "./theme/define.js";
import type { ThemeOptions } from "./theme-script.js";
import { oklchToHex } from "./utils/palette-generator.js";

/** Literal sRGB colors of one scheme. */
export interface BrandColors {
	/** Outline color (`--ca-text-primary`). */
	ink: string;
	/** Accent color (`--ca-brand-main`). */
	spark: string;
	/** Page background (`--ca-surface-base`); fills opaque icons. */
	surface: string;
}

export interface ResolvedBrand {
	light: BrandColors;
	dark: BrandColors;
}

const HEX = /^#[0-9a-f]{6}$/i;
const toHex = (c: string) => (HEX.test(c) ? c.toLowerCase() : oklchToHex(c));

/** Colors of the theme's default preset in both schemes, as `#rrggbb`. Pure: same theme, same result. */
export function resolveBrand(theme: ThemeOptions = {}): ResolvedBrand {
	const t = defaultPresetTokens(defineTheme(theme));
	const pick = (m: Record<string, string>): BrandColors => ({
		ink: toHex(m["--ca-text-primary"]),
		spark: toHex(m["--ca-brand-main"]),
		surface: toHex(m["--ca-surface-base"]),
	});
	return { light: pick(t.light), dark: pick(t.dark) };
}

/** Fills the `{{ink}}` / `{{spark}}` placeholders of a mark and drops its comments. Throws on a mark with a literal color or a missing placeholder. */
export function renderMark(mark: string, colors: { ink: string; spark: string }): string {
	if (!mark.includes("{{ink}}") || !mark.includes("{{spark}}"))
		throw new Error("[codeatlasdev/ui] brand mark must contain {{ink}} and {{spark}} placeholders");
	if (/#[0-9a-f]{3,8}\b|oklch\(|rgba?\(|hsla?\(/i.test(mark.replace(/<!--[\s\S]*?-->/g, "")))
		throw new Error(
			"[codeatlasdev/ui] brand mark must not contain literal colors, use {{ink}} / {{spark}}"
		);
	return mark
		.replace(/<!--[\s\S]*?-->\s*/g, "")
		.replaceAll("{{ink}}", colors.ink)
		.replaceAll("{{spark}}", colors.spark);
}

/** The mark as a standalone SVG favicon that follows `prefers-color-scheme`. */
export function faviconSvg(mark: string, brand: ResolvedBrand): string {
	const inner = renderMark(mark, { ink: "var(--ink)", spark: "var(--spark)" });
	const style =
		`<style>:root{--ink:${brand.light.ink};--spark:${brand.light.spark}}` +
		`@media (prefers-color-scheme:dark){:root{--ink:${brand.dark.ink};--spark:${brand.dark.spark}}}</style>`;
	return inner.replace(/(<svg\b[^>]*>)/, `$1${style}`);
}

/** First 10 hex chars of the sha256 of the parts. */
export function brandHash(...parts: string[]): string {
	const h = createHash("sha256");
	for (const p of parts) h.update(p).update("\0");
	return h.digest("hex").slice(0, 10);
}

/** Public URLs of the generated assets. `og` is keyed by whatever the caller passed in `ogPages`. */
export interface BrandAssets {
	favicon: string;
	ico: string;
	favicon32: string;
	appleTouch: string;
	icon192: string;
	icon512: string;
	maskable512: string;
	manifest: string;
	/** Input hash shared by every icon; changes when the mark, the colors or the sizes change. */
	hash: string;
}

export interface GenerateBrandOptions {
	/** Mark SVG source (placeholders, see module docs). */
	mark: string;
	theme: ThemeOptions;
	/** Directory that is served as `/brand` (e.g. `public/brand`). Emptied first. */
	outDir: string;
	/** URL prefix of `outDir`. @default "/brand" */
	base?: string;
	/** Web app manifest fields. */
	name?: string;
	shortName?: string;
}

const SIZES = [16, 32, 48] as const;

/**
 * Render options for one PNG. resvg loads every system font on each construction by default
 * (~450 ms per render on Windows); a mark drawn with paths needs none, so fonts load only when the
 * SVG has text (#120).
 */
export function resvgOptions(svg: string, size: number) {
	return {
		fitTo: { mode: "width" as const, value: size },
		font: { loadSystemFonts: /<text\b/.test(svg) },
	};
}

/** Everything that decides the output names, without rendering: shared by `generateBrand` and `brandUrls`. */
function plan(o: Pick<GenerateBrandOptions, "mark" | "theme" | "base" | "name" | "shortName">) {
	const base = (o.base ?? "/brand").replace(/\/$/, "");
	const brand = resolveBrand(o.theme);
	const scheme: keyof ResolvedBrand =
		defineTheme(o.theme).defaultScheme === "light" ? "light" : "dark";
	// resvg and standalone SVG files need the namespace; inline use in HTML does not.
	const mark = /<svg\b[^>]*\bxmlns=/.test(o.mark)
		? o.mark
		: o.mark.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
	renderMark(mark, brand.light); // validates the placeholders and rejects literal colors
	const hash = brandHash(
		mark,
		JSON.stringify(brand),
		scheme,
		JSON.stringify(SIZES),
		o.name ?? "",
		o.shortName ?? ""
	);
	const url = (name: string) => `${base}/${name}`;
	const assets: BrandAssets = {
		favicon: url(`favicon.${hash}.svg`),
		ico: url(`favicon.${hash}.ico`),
		favicon32: url(`favicon-32.${hash}.png`),
		appleTouch: url(`apple-touch-icon.${hash}.png`),
		icon192: url(`icon-192.${hash}.png`),
		icon512: url(`icon-512.${hash}.png`),
		maskable512: url(`maskable-512.${hash}.png`),
		manifest: url(`manifest.${hash}.webmanifest`),
		hash,
	};
	return { mark, brand, scheme, hash, assets, url };
}

/**
 * The URLs `generateBrand` will write, computed from the inputs alone (no rasterizer, no files).
 * Names depend on a hash of the inputs, so this is cheap and exact.
 */
export function brandUrls(
	o: Pick<GenerateBrandOptions, "mark" | "theme" | "base" | "name" | "shortName">
): BrandAssets {
	return plan(o).assets;
}

/** Optional peers with a native binary: never bundled, always resolved by Node at runtime. */
const NATIVE_PEERS = ["@resvg/resvg-js", "png-to-ico"] as const;

/**
 * Loads an optional peer at runtime. The specifier is a variable on purpose (the documented exception
 * to static imports): a literal `import("@resvg/resvg-js")` makes Rolldown follow the call into the
 * `.node` binary as soon as any SSR graph reaches this module, e.g. through `designStyle` (#184).
 */
async function optionalPeer<T>(name: (typeof NATIVE_PEERS)[number]): Promise<T> {
	try {
		return (await import(/* @vite-ignore */ name)) as T;
	} catch (e) {
		return missing(name, e);
	}
}

/**
 * Writes `favicon.<h>.svg`, `favicon.<h>.ico` (16/32/48), `favicon-32.<h>.png`, `apple-touch-icon.<h>.png`
 * (180, opaque), `icon-192/512.<h>.png`, `maskable-512.<h>.png` and `manifest.<h>.webmanifest`.
 * Needs the optional peers `@resvg/resvg-js` and `png-to-ico`.
 */
export async function generateBrand(o: GenerateBrandOptions): Promise<BrandAssets> {
	const [{ Resvg }, { default: pngToIco }] = await Promise.all([
		optionalPeer<typeof ResvgModule>("@resvg/resvg-js"),
		optionalPeer<typeof PngToIcoModule>("png-to-ico"),
	]);
	const { mark, brand, scheme, hash, assets, url } = plan(o);
	const light = renderMark(mark, brand.light);

	/** Mark centered on an opaque square. `inset` is the fraction of the canvas left empty on each side. */
	const tile = (size: number, inset: number) => {
		const inner = size * (1 - inset * 2);
		const body = light.replace(/^[\s\S]*?<svg\b[^>]*>|<\/svg>\s*$/g, "");
		const vb = (light.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 32 32").split(/\s+/).map(Number);
		return (
			`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
			`<rect width="${size}" height="${size}" fill="${brand.light.surface}"/>` +
			`<svg x="${size * inset}" y="${size * inset}" width="${inner}" height="${inner}" viewBox="${vb.join(" ")}">${body}</svg></svg>`
		);
	};
	const png = (svg: string, size: number) =>
		new Resvg(svg, resvgOptions(svg, size)).render().asPng();
	/** Transparent PNG of the mark alone (favicon sizes). */
	const bare = (size: number) =>
		png(light.replace(/<svg\b/, `<svg width="${size}" height="${size}"`), size);

	const outDir = resolve(o.outDir);
	rmSync(outDir, { recursive: true, force: true });
	mkdirSync(outDir, { recursive: true });
	const files: Record<string, Uint8Array | string> = {
		[`favicon.${hash}.svg`]: faviconSvg(mark, brand),
		[`favicon.${hash}.ico`]: await pngToIco(SIZES.map((s) => Buffer.from(bare(s)))),
		[`favicon-32.${hash}.png`]: bare(32),
		[`apple-touch-icon.${hash}.png`]: png(tile(180, 0.14), 180),
		[`icon-192.${hash}.png`]: png(tile(192, 0.14), 192),
		[`icon-512.${hash}.png`]: png(tile(512, 0.14), 512),
		// Maskable: content inside the central 80% safe zone (W3C maskable icon spec).
		[`maskable-512.${hash}.png`]: png(tile(512, 0.2), 512),
	};
	// One color per manifest field (the spec has no per-scheme variant): the default scheme's, with
	// `system` counting as dark, the same rule `manifest()` follows. `id` pins the app identity so a
	// later `start_url` change does not install a second copy.
	const surface = brand[scheme].surface;
	const manifest = {
		id: "/",
		name: o.name,
		short_name: o.shortName ?? o.name,
		start_url: "/",
		scope: "/",
		display: "standalone",
		background_color: surface,
		theme_color: surface,
		icons: [
			{ src: url(`icon-192.${hash}.png`), sizes: "192x192", type: "image/png" },
			{ src: url(`icon-512.${hash}.png`), sizes: "512x512", type: "image/png" },
			{
				src: url(`maskable-512.${hash}.png`),
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
	files[`manifest.${hash}.webmanifest`] = JSON.stringify(manifest, null, "\t");
	for (const [name, data] of Object.entries(files)) writeFileSync(join(outDir, name), data);

	return assets;
}

function missing(pkg: string, cause: unknown): never {
	throw new Error(
		`[codeatlasdev/ui] caBrandPlugin needs the optional peer dependency "${pkg}": bun add -d ${pkg}`,
		{
			cause,
		}
	);
}

export interface CaBrandPluginOptions {
	/** Path to the mark SVG, relative to the project root. @default "src/brand/mark.svg" */
	mark?: string;
	/** The same `ThemeOptions` passed to `caThemePlugin`. */
	theme?: ThemeOptions;
	/** Directory served as `/brand`. @default "static/brand" (SvelteKit); use "public/brand" for Vite and Astro. */
	outDir?: string;
	/** URL prefix. @default "/brand" */
	base?: string;
	/** Where the asset URLs are written as a TypeScript module. @default "src/generated/brand.ts" */
	manifestFile?: string;
	name?: string;
	shortName?: string;
}

function writeBrandModule(file: string, assets: BrandAssets) {
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(
		file,
		`// Generated by caBrandPlugin / \`codeatlas-ui brand\`. Do not edit or commit.\nexport const brand = ${JSON.stringify(assets, null, "\t")} as const;\n`
	);
}

/** Reads the mark and options relative to `root`; `null` (after a warning) when the mark file is missing. */
function brandInputs(root: string, options: CaBrandPluginOptions) {
	const markFile = resolve(root, options.mark ?? "src/brand/mark.svg");
	if (!existsSync(markFile)) {
		console.warn(`\n[codeatlasdev/ui] caBrandPlugin: no mark at ${markFile}; skipped.\n`);
		return null;
	}
	return {
		mark: readFileSync(markFile, "utf8"),
		theme: options.theme ?? {},
		base: options.base,
		name: options.name,
		shortName: options.shortName,
		outDir: resolve(root, options.outDir ?? "static/brand"),
		moduleFile: resolve(root, options.manifestFile ?? "src/generated/brand.ts"),
	};
}

/**
 * Renders the whole set and writes the module, outside Vite: what `codeatlas-ui brand` runs, for a
 * type-check-only job on a fresh clone. Returns `false` when the mark file is missing.
 */
export async function runBrand(root: string, options: CaBrandPluginOptions): Promise<boolean> {
	const i = brandInputs(root, options);
	if (!i) return false;
	writeBrandModule(i.moduleFile, await generateBrand(i));
	return true;
}

/**
 * Vite plugin. As soon as the config resolves (dev server, build, and any tool that loads the Vite
 * config) it writes `src/generated/brand.ts` exporting `brand: BrandAssets`: the URLs depend only on a
 * hash of the inputs, so no rendering is needed and the module type-checks before the first build.
 * At build start (and dev server start) it renders the favicon set. `svelte-kit sync` and
 * `svelte-check` do not load Vite plugins: run `bunx @codeatlasdev/ui brand` first in a job that only
 * type-checks. Add `outDir` and the generated module to `.gitignore`: nothing it writes is meant to be committed.
 * Warns and does nothing when the mark file is missing.
 */
export function caBrandPlugin(options: CaBrandPluginOptions = {}): Plugin {
	let root = "";
	return {
		name: "codeatlasdev-ui:brand",
		// Belt and braces for #184: the specifiers below are already opaque to bundlers, but an app
		// that bundles the SSR graph must never try to inline these native packages.
		config: () => ({ ssr: { external: [...NATIVE_PEERS] } }),
		configResolved(config) {
			root = config.root;
			const i = brandInputs(root, options);
			if (i) writeBrandModule(i.moduleFile, brandUrls(i));
		},
		async buildStart() {
			await runBrand(root, options);
		},
	};
}
