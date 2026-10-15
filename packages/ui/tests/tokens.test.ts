import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
	duration,
	easing,
	elevation,
	GLASS_OPTICS,
	getPreset,
	MATERIAL_BLUR_VARS,
	MATERIAL_CSS_VARS,
	neutralRamp,
	radius,
	THEME_PRESETS,
	zIndex,
} from "../src/lib/tokens/index.js";

const css = readFileSync(new URL("../src/lib/styles/tokens.css", import.meta.url), "utf8");
const cssVar = (name: string) => css.match(new RegExp(`--ca-${name}:\\s*([^;]+);`))?.[1].trim();

describe("tokens ↔ tokens.css parity", () => {
	it.each(Object.entries(radius))("radius.%s", (k, v) => {
		// Steps are scaled by --ca-radius-scale; the base px must match the TS scale.
		const css = cssVar(`radius-${k}`);
		expect(
			k === "pill" ? css : css.replace(/calc\((\d+)px \* var\(--ca-radius-scale\)\)/, "$1px")
		).toBe(`${v}px`);
	});

	it.each(Object.entries(zIndex).filter(([k]) => k !== "base" && k !== "raised"))(
		"zIndex.%s",
		(k, v) => {
			expect(cssVar(`z-${k}`)).toBe(String(v));
		}
	);

	it.each(["standard", "decelerate", "accelerate", "spring"] as const)("easing.%s", (k) => {
		expect(cssVar(`ease-${k}`)).toBe(easing[k]);
	});
});

describe("scales", () => {
	it("radius is strictly increasing", () => {
		const v = [radius.xs, radius.sm, radius.md, radius.lg, radius.xl, radius.pill];
		expect(v).toEqual([...v].sort((a, b) => a - b));
		expect(new Set(v).size).toBe(v.length);
	});

	it("zIndex layers stack nav < dropdown < sticky < fixed < drawer < modal < snackbar < tooltip", () => {
		const order = [
			"nav",
			"dropdown",
			"sticky",
			"fixed",
			"drawer",
			"modal",
			"snackbar",
			"tooltip",
		] as const;
		for (let i = 1; i < order.length; i++) {
			expect(zIndex[order[i]]).toBeGreaterThan(zIndex[order[i - 1]]);
		}
	});

	it("elevation grows with thickness", () => {
		const v = Object.values(elevation);
		expect(v).toEqual([...v].sort((a, b) => a - b));
	});

	it("durations are positive numbers", () => {
		for (const v of Object.values(duration)) expect(v).toBeGreaterThan(0);
	});
});

describe("materials", () => {
	const tiers = ["ultra-thin", "thin", "regular", "thick", "chrome"] as const;

	it("every thickness has distinct tint + blur vars and optics", () => {
		expect(new Set(tiers.map((t) => MATERIAL_CSS_VARS[t])).size).toBe(5);
		expect(new Set(tiers.map((t) => MATERIAL_BLUR_VARS[t])).size).toBe(5);
		for (const t of tiers) expect(GLASS_OPTICS[t].frost).toBeGreaterThan(0);
	});

	it("frost increases monotonically with thickness", () => {
		const f = tiers.map((t) => GLASS_OPTICS[t].frost);
		expect(f).toEqual([...f].sort((a, b) => a - b));
	});

	it("tint vars reference declared css custom properties", () => {
		for (const t of tiers) {
			const name = MATERIAL_CSS_VARS[t].match(/var\((--[\w-]+)\)/)?.[1];
			expect(name).toBeTruthy();
		}
	});
});

describe("neutralRamp", () => {
	it("shifts only hue between presets", () => {
		const a = neutralRamp(55);
		const b = neutralRamp(260);
		expect(a.surfaceLight.base).toBe("oklch(0.955 0.002 55)");
		expect(b.surfaceLight.base).toBe("oklch(0.955 0.002 260)");
		expect(a.outlineDark).toEqual(b.outlineDark);
	});

	it("dark text hue is offset +5", () => {
		expect(neutralRamp(100).textDark.primary).toBe("oklch(0.940 0.003 105)");
	});
});

describe("presets", () => {
	it("ships 8 unique built-in presets", () => {
		expect(THEME_PRESETS.map((p) => p.id)).toEqual([
			"amber",
			"ocean",
			"crimson",
			"cyan",
			"violet",
			"emerald",
			"rose",
			"slate",
		]);
	});

	it.each(THEME_PRESETS.map((p) => [p.id, p] as const))(
		"%s has brand + semantic slots",
		(_id, p) => {
			expect(p.label).toBeTruthy();
			expect(p.swatchColor).toMatch(/^#[0-9a-f]{6}$/i);
			for (const slot of [p.brandLight, p.brandDark]) {
				for (const k of ["main", "light", "dark", "contrast"] as const) {
					expect(slot[k]).toMatch(/^oklch\(/);
				}
			}
			expect(p.semanticLight.error).toBeTruthy();
			expect(p.semanticDark.error).toBeTruthy();
		}
	);

	it("each preset has a theme css file that declares its data-preset selector", () => {
		for (const p of THEME_PRESETS) {
			const file = new URL(`../src/lib/styles/presets/${p.id}.css`, import.meta.url);
			const text = readFileSync(file, "utf8");
			if (p.id === "amber") expect(text).toContain(":root");
			else expect(text).toContain(`[data-preset="${p.id}"]`);
		}
	});

	it("getPreset resolves by id and falls back to amber", () => {
		expect(getPreset("ocean").id).toBe("ocean");
		expect(getPreset("does-not-exist").id).toBe("amber");
	});
});

describe("css entry points", () => {
	const read = (f: string) =>
		readFileSync(new URL(`../src/lib/styles/${f}`, import.meta.url), "utf8");
	const imports = (css: string) =>
		[...css.matchAll(/@import url\('\.\/([^']+)'\)/g)].map((m) => m[1]);

	it("core.css carries the default amber preset and no other", () => {
		const files = imports(read("core.css"));
		expect(files).toContain("presets/amber.css");
		expect(files.filter((f) => f.startsWith("presets/") && f !== "presets/amber.css")).toEqual([]);
	});

	it("global.css is core plus every built-in preset (backwards compatible)", () => {
		const files = imports(read("global.css"));
		expect(files).toContain("core.css");
		for (const p of THEME_PRESETS.filter((x) => x.id !== "amber"))
			expect(files).toContain(`presets/${p.id}.css`);
	});
});
