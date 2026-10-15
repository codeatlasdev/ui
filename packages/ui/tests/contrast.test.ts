import { describe, expect, it } from "bun:test";
import { BUILTIN_PRESETS } from "../src/lib/theme/builtins.js";
import { presetCSS } from "../src/lib/theme/define.js";
import { oklchToHex } from "../src/lib/utils/palette-generator.js";

// WCAG 2 contrast on gamut-clipped sRGB, same conversion the package uses for chrome.
// Colors are kept sRGB-encoded (0..1) so alpha blends the way browsers do it (in encoded space);
// luminance linearizes only when computing the ratio.
const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
const linear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]: number[]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const ratio = (a: number[], b: number[]) => {
	const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};
/** Composite an `oklch(L C H / a)` over an opaque background (encoded sRGB, like a browser). */
const over = (color: string, bg: number[]) => {
	const alpha = Number(color.match(/\/\s*([\d.]+)\)/)?.[1] ?? 1);
	const fg = rgb(oklchToHex(color));
	return fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));
};

/** Token map of the `prefers-contrast: more` block for one scheme (`light` = first rule, `dark` = second). */
function contrastTokens(css: string, scheme: "light" | "dark") {
	const media = css.slice(css.indexOf("@media (prefers-contrast: more)"));
	const rules = [...media.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
	const body = rules[scheme === "light" ? 0 : 1];
	return Object.fromEntries(
		[...body.matchAll(/(--ca-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]])
	);
}

const brand = { id: "acme", color: "#0f766e" as const };
const sources = [...BUILTIN_PRESETS, brand];
// Darkest light surface and lightest dark surface a text token can sit on (generator constants).
const surface = (scheme: "light" | "dark", hue: number) =>
	rgb(oklchToHex(scheme === "light" ? `oklch(0.930 0.003 ${hue})` : `oklch(0.235 0.002 ${hue})`));

describe("prefers-contrast: more tokens", () => {
	for (const src of sources) {
		for (const scheme of ["light", "dark"] as const) {
			it(`${src.id} ${scheme}: secondary/hint text >= 7:1, outlines >= 3:1`, () => {
				const css = presetCSS(src, "hue" in src ? "builtin" : "brand");
				const tokens = contrastTokens(css, scheme);
				const hue = Number(tokens["--ca-text-secondary"].match(/\s([\d.]+)\)$/)?.[1]);
				const bg = surface(scheme, hue);
				for (const name of ["--ca-text-secondary", "--ca-text-hint"]) {
					expect(ratio(over(tokens[name], bg), bg), name).toBeGreaterThanOrEqual(7);
				}
				for (const name of ["--ca-outline-subtle", "--ca-outline-default", "--ca-outline-strong"]) {
					expect(ratio(over(tokens[name], bg), bg), name).toBeGreaterThanOrEqual(3);
				}
				expect(ratio(over(tokens["--ca-outline-strong"], bg), bg)).toBeGreaterThanOrEqual(7);
				// The #19/#20 tokens follow the same lift: control edge >= 3:1, disabled label >= 3:1.
				for (const name of ["--ca-outline-control", "--ca-text-disabled"])
					expect(ratio(over(tokens[name], bg), bg), name).toBeGreaterThanOrEqual(3);
			});
		}
	}

	it("brand presets get the block too, scoped like the base tokens", () => {
		const css = presetCSS(brand, "brand");
		expect(css).toMatch(/@media \(prefers-contrast: more\) \{\n\[data-preset="acme"\]/);
	});
});

// ── Role guarantees (#19-#24) ────────────────────────────────────────────────
// Every token a control or overlay is drawn with must hold its contrast on every surface it can sit
// on, in every preset and scheme (plus a brand preset). Resolved from the real CSS, no mirrored constants.
import { readdirSync, readFileSync } from "node:fs";
import { defineTheme, themeCSS } from "../src/lib/theme/define.js";

const LIB = new URL("../src/lib/", import.meta.url);
const read = (p: string) => readFileSync(new URL(p, LIB), "utf8");
const tokensCss = read("styles/tokens.css");
const materialsCss = read("styles/materials.css");

/** `--ca-*: value;` declarations of the first rule whose selector list matches. */
function declsOf(source: string, selector: RegExp): Record<string, string> {
	const out: Record<string, string> = {};
	const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
	for (const rule of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
		// A rule applies when ANY selector of its list matches.
		const sels = rule[1].split(",").map((x) => x.trim());
		if (!sels.some((x) => selector.test(x))) continue;
		for (const d of rule[2].matchAll(/(--ca-[\w-]+):\s*([^;]+);/g)) out[d[1]] ??= d[2].trim();
	}
	return out;
}

/** Resolved token map for one preset + scheme: static tokens, then preset tokens (both from the shipped CSS). */
function resolved(src: (typeof sources)[number], scheme: "light" | "dark") {
	const kind = "hue" in src ? "builtin" : "brand";
	const css = presetCSS(src, kind).split("@media (prefers-contrast: more)")[0];
	const preset = declsOf(
		css,
		scheme === "light" ? /^\[data-preset=/ : /^\.dark\[data-preset=|^\.dark \[data-preset=/
	);
	const statics = declsOf(tokensCss, scheme === "light" ? /^:root/ : /^\.dark/);
	// Mode-invariant :root tokens (focus ring, overlay layer) apply to both schemes.
	const shared = { ...declsOf(tokensCss, /^:root$/), ...declsOf(materialsCss, /^:root$/) };
	return { ...shared, ...statics, ...preset };
}

/** Resolve `var(--x)` chains and `color-mix(in oklab, A p%, transparent)` to an `oklch(... / a)` string. */
function resolve(tokens: Record<string, string>, name: string): string {
	let v = tokens[name];
	for (let i = 0; i < 8 && v?.startsWith("var("); i++) v = tokens[v.match(/var\((--[\w-]+)\)/)![1]];
	if (!v) throw new Error(`token ${name} missing`);
	return v;
}

const SURFACES = [
	"--ca-surface-sunken",
	"--ca-surface-base",
	"--ca-surface-raised",
	"--ca-surface-overlay",
];
const surfaceRgb = (t: Record<string, string>, name: string) => rgb(oklchToHex(resolve(t, name)));
/** The 5% text tint a field is filled with, over a surface. */
const tint = (t: Record<string, string>, base: number[]) =>
	over(`oklch(${/oklch\(([^)/]+)/.exec(resolve(t, "--ca-text-primary"))![1]} / 0.05)`, base);

describe("--ca-text-disabled (#21)", () => {
	for (const src of sources)
		for (const scheme of ["light", "dark"] as const)
			it(`${src.id} ${scheme}: >= 3:1 on every surface`, () => {
				const t = resolved(src, scheme);
				for (const s of SURFACES) {
					const bg = surfaceRgb(t, s);
					expect(ratio(over(resolve(t, "--ca-text-disabled"), bg), bg), s).toBeGreaterThanOrEqual(
						3
					);
				}
			});
});

describe("--ca-outline-control (#20)", () => {
	for (const src of sources)
		for (const scheme of ["light", "dark"] as const)
			it(`${src.id} ${scheme}: >= 3:1 on every surface and on the 5% field tint`, () => {
				const t = resolved(src, scheme);
				for (const s of SURFACES) {
					const bg = surfaceRgb(t, s);
					for (const fill of [bg, tint(t, bg)])
						expect(
							ratio(over(resolve(t, "--ca-outline-control"), fill), fill),
							s
						).toBeGreaterThanOrEqual(3);
				}
			});
});

describe("--ca-semantic-error-contrast (#22)", () => {
	for (const src of sources)
		for (const scheme of ["light", "dark"] as const)
			it(`${src.id} ${scheme}: >= 4.5:1 on --ca-semantic-error-fill`, () => {
				const t = resolved(src, scheme);
				const fill = surfaceRgb(t, "--ca-semantic-error-fill");
				const fg = rgb(oklchToHex(resolve(t, "--ca-semantic-error-contrast")));
				expect(ratio(fg, fill)).toBeGreaterThanOrEqual(4.5);
			});

	it("a theme that owns a light error colour derives a readable contrast", () => {
		const css = themeCSS(
			defineTheme({
				presets: [
					{ id: "pale", color: "#0f766e", colors: { light: { error: "oklch(0.80 0.12 22)" } } },
				],
			})
		);
		expect(css).toMatch(/--ca-semantic-error-contrast:\s*oklch\(0\.1/);
	});

	it("Button destructive reads the token, not a literal", () => {
		const btn = readFileSync(new URL("components/Button/Button.svelte", LIB), "utf8");
		const rule = btn.match(/\.ca-btn--destructive\s*\{[^}]*\}/)![0];
		expect(rule).toContain("var(--ca-semantic-error-contrast)");
	});
});

describe("overlay surfaces (#23)", () => {
	const overlayBg = declsOf(materialsCss, /^:root$/)["--ca-overlay-bg"];
	for (const src of sources)
		for (const scheme of ["light", "dark"] as const)
			it(`${src.id} ${scheme}: text on --ca-overlay-bg >= 4.5:1 over white, black and gray`, () => {
				const t = resolved(src, scheme);
				const bgColor = resolve(t, "--ca-overlay-bg");
				const layer = /color-mix\(in oklab, var\((--[\w-]+)\) (\d+)%, transparent\)/.exec(bgColor);
				const colour = layer
					? `${resolve(t, layer[1]).replace(/\)$/, "")} / ${Number(layer[2]) / 100})`
					: bgColor;
				for (const backdrop of [
					[1, 1, 1],
					[0, 0, 0],
					[0.5, 0.5, 0.5],
				]) {
					const surface = over(colour, backdrop);
					for (const text of ["--ca-text-primary", "--ca-text-secondary"])
						expect(
							ratio(rgb(oklchToHex(resolve(t, text))), surface),
							`${text} over ${backdrop[0]}`
						).toBeGreaterThanOrEqual(4.5);
				}
			});

	it("the default overlay is near-opaque and the thin glass stays available", () => {
		expect(overlayBg).toMatch(/94%|9[2-9]%|surface-overlay/);
		expect(declsOf(materialsCss, /^:root$/)["--ca-overlay-bg-glass"]).toBeTruthy();
	});
});

describe("--ca-focus-ring (#24)", () => {
	const NEIGHBOURS = ["--ca-action-hover", "--ca-action-selected"];
	const fills = (t: Record<string, string>) => {
		const out: [string, number[], number[]][] = [];
		for (const s of SURFACES) {
			const bg = surfaceRgb(t, s);
			out.push([s, bg, bg]);
			for (const n of NEIGHBOURS) out.push([`${n} on ${s}`, over(resolve(t, n), bg), bg]);
		}
		return out;
	};
	for (const src of sources)
		for (const scheme of ["light", "dark"] as const)
			it(`${src.id} ${scheme}: >= 3:1 on surfaces and on the hover/selected fills`, () => {
				const t = resolved(src, scheme);
				const ring = rgb(oklchToHex(resolve(t, "--ca-focus-ring")));
				for (const [name, fill] of fills(t))
					expect(ratio(ring, fill), name).toBeGreaterThanOrEqual(3);
			});

	it("a ring floats off filled controls: the offset gap shows the surface, not the fill", () => {
		// The brand fill is mid-tone, so no brand-hued ring is 3:1 from it AND from the page; WCAG 2.4.11
		// compares the ring with its adjacent pixels, which the 2px offset makes the surface.
		const t = resolved(sources[0], "light");
		expect(Number.parseFloat(resolve(t, "--ca-focus-ring-offset"))).toBeGreaterThanOrEqual(2);
		const btn = readFileSync(new URL("components/Button/Button.svelte", LIB), "utf8");
		expect(btn.match(/\.ca-btn:focus-visible\s*\{[^}]*\}/)![0]).toContain("--ca-focus-ring-offset");
	});

	it("no component hard-codes --ca-brand-main inside a focus rule", () => {
		const offenders: string[] = [];
		const walk = (dir: URL) => {
			for (const e of readdirSync(dir, { withFileTypes: true })) {
				const u = new URL(e.name + (e.isDirectory() ? "/" : ""), dir);
				if (e.isDirectory()) walk(u);
				else if (/\.(svelte|css)$/.test(e.name) && !/\.test\./.test(e.name)) {
					const src = readFileSync(u, "utf8");
					for (const m of src.matchAll(
						/([^{}]*:(?:focus-visible|focus-within|focus)\b[^{}]*)\{([^{}]*)\}/g
					))
						if (/--ca-brand-main/.test(m[2]) && !/focus-ring/.test(m[2]))
							offenders.push(`${e.name}: ${m[1].trim().split("\n").pop()}`);
				}
			}
		};
		walk(new URL("components/", LIB));
		walk(new URL("styles/", LIB));
		expect(offenders).toEqual([]);
	});
});

describe("disabled controls keep their label legible (#19)", () => {
	it("no component dims a labelled element with opacity in a disabled rule", () => {
		const offenders: string[] = [];
		const walk = (dir: URL) => {
			for (const e of readdirSync(dir, { withFileTypes: true })) {
				const u = new URL(e.name + (e.isDirectory() ? "/" : ""), dir);
				if (e.isDirectory()) walk(u);
				else if (/\.(svelte|css)$/.test(e.name) && !/\.test\./.test(e.name)) {
					const src = readFileSync(u, "utf8");
					for (const m of src.matchAll(
						/([^{}]*(?::disabled|\[aria-disabled|\[disabled|\[data-disabled|--disabled)[^{}]*)\{([^{}]*)\}/g
					))
						if (/(^|[;\s])opacity:\s*0?\.\d/.test(m[2]) && !/loading/.test(m[1]))
							offenders.push(`${e.name}: ${m[1].trim().split("\n").pop()}`);
				}
			}
		};
		walk(new URL("components/", LIB));
		expect(offenders).toEqual([]);
	});

	it("filled/glass/destructive have an explicit disabled look from tokens", () => {
		const btn = readFileSync(new URL("components/Button/Button.svelte", LIB), "utf8");
		for (const v of ["filled", "glass", "destructive", "outlined"])
			expect(btn, v).toMatch(new RegExp(`\\.ca-btn--${v}:disabled`));
		expect(btn).toContain("var(--ca-action-disabled-bg)");
		expect(btn).toContain("var(--ca-text-disabled)");
	});

	// Label colour over the real fill, no opacity multiplication, for every preset and scheme.
	for (const src of sources)
		for (const scheme of ["light", "dark"] as const)
			it(`${src.id} ${scheme}: disabled label >= 3:1 over disabled fill on every surface`, () => {
				const t = resolved(src, scheme);
				for (const s of SURFACES) {
					const bg = surfaceRgb(t, s);
					const fill = over(resolve(t, "--ca-action-disabled-bg"), bg);
					expect(
						ratio(over(resolve(t, "--ca-text-disabled"), fill), fill),
						s
					).toBeGreaterThanOrEqual(3);
				}
			});
});

describe("--ca-state-indicator: selected markers (#24)", () => {
	for (const src of sources)
		for (const scheme of ["light", "dark"] as const)
			it(`${src.id} ${scheme}: >= 3:1 on surfaces and on hover/selected fills`, () => {
				const t = resolved(src, scheme);
				const mark = rgb(oklchToHex(resolve(t, "--ca-state-indicator")));
				for (const s of SURFACES) {
					const bg = surfaceRgb(t, s);
					expect(ratio(mark, bg), s).toBeGreaterThanOrEqual(3);
					for (const n of ["--ca-action-hover", "--ca-action-selected"])
						expect(ratio(mark, over(resolve(t, n), bg)), `${n} on ${s}`).toBeGreaterThanOrEqual(3);
				}
			});

	it("Switch, Slider and the segmented thumb draw their selected marker with the token", () => {
		for (const [file, sel] of [
			["Switch/Switch.svelte", /\.ca-switch\[data-state='checked'\]\)\s*\{[^}]*\}/],
			["Slider/Slider.svelte", /:global\(\.ca-slider__range\)\s*\{[^}]*\}/],
			["ToggleGroup/SegmentedControl.svelte", /\.ca-seg__thumb\)\s*\{[^}]*\}/],
		] as const) {
			const src = readFileSync(new URL(`components/${file}`, LIB), "utf8");
			expect(src.match(sel)?.[0], file).toContain("--ca-state-indicator");
		}
	});
});

// FilterGroup draws its caption on a `--ca-action-hover` pill that sits on any surface. The caption
// is readable content, and `--ca-text-hint` is the role for placeholders and disabled-adjacent hints
// that an app may set low (a custom preset gave it 4.1:1 on the raised surface and failed axe), so the
// caption must use the role that holds AA in every preset: `--ca-text-secondary`.
describe("FilterGroup label on its pill", () => {
	const css = readFileSync(new URL("components/FilterGroup/FilterGroup.svelte", LIB), "utf8");
	const token = css.match(/\.ca-filter-group__label\s*\{[^}]*?color:\s*var\((--ca-[\w-]+)\)/)?.[1];

	it("is drawn with a text role that is not the hint role", () => {
		expect(token).toBe("--ca-text-secondary");
	});

	for (const src of sources)
		for (const scheme of ["light", "dark"] as const)
			it(`${src.id} ${scheme}: its role is >= 4.5:1 on the pill over every surface`, () => {
				const t = resolved(src, scheme);
				const fill = resolve(t, "--ca-action-hover");
				for (const s of SURFACES) {
					const pill = over(fill, surfaceRgb(t, s));
					expect(ratio(over(resolve(t, token as string), pill), pill), s).toBeGreaterThanOrEqual(
						4.5
					);
				}
			});
});
