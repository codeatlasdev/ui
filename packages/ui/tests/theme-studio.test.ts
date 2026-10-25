import { describe, expect, it } from "bun:test";
import { FONTS, familyOf, stackOf } from "../../../site/src/components/theme/fonts.js";
import { LOOKS } from "../../../site/src/components/theme/looks.js";
import {
	BUILTIN_PRESETS_IDS,
	COALESCE_MS,
	commit,
	createHistory,
	DEFAULT_STATE,
	decodeState,
	encodeState,
	redo,
	STUDIO_PRESET,
	type StudioState,
	sanitizeState,
	toThemeOptions,
	undo,
} from "../../../site/src/components/theme/studio-state.js";
import { BUILTIN_PRESETS } from "../src/lib/theme/builtins.js";
import { defineTheme, themeCSS } from "../src/lib/theme/define.js";

const edit = (p: Partial<StudioState>): StudioState => ({
	...structuredClone(DEFAULT_STATE),
	...p,
});

describe("studio state → ThemeOptions", () => {
	it("keeps the built-in preset ids in lockstep with the package", () => {
		expect(BUILTIN_PRESETS_IDS).toEqual(BUILTIN_PRESETS.map((p) => p.id));
	});

	it("maps each control onto its ThemeOptions key and compiles through the real engine", () => {
		const s = edit({
			brand: "#e8590c",
			radius: 1.2,
			density: "compact",
			elevation: "hard",
			fontScale: 1.1,
			motionScale: 0.5,
			fonts: { body: '"Inter", sans-serif' },
		});
		const o = toThemeOptions(s);
		expect(o.presets?.[0]).toMatchObject({ id: STUDIO_PRESET, color: "#e8590c" });
		expect(o.radius).toBe(1.2);
		expect(o.density).toBe("compact");
		expect(o.typography?.scale).toBe(1.1);
		expect(o.motion?.scale).toBe(0.5);
		const css = themeCSS(defineTheme(o));
		expect(css).toContain('[data-preset="studio"]');
		expect(css).toContain("--ca-radius-scale: 1.2");
		expect(css).toContain("--ca-density: 0.75");
		expect(css).toContain("--ca-motion-scale: 0.5");
		expect(css).toContain('--ca-font-sans: "Inter", sans-serif');
	});

	it("emits nothing for a default state beyond the preset choice", () => {
		const o = toThemeOptions(edit({ preset: "ocean" }));
		expect(o).toEqual({ defaultPreset: "ocean", defaultScheme: "dark", defaultStyle: "solid" });
	});

	it("hand-picked roles land in the preset's per-scheme colors", () => {
		const o = toThemeOptions(
			edit({ colors: { light: { text: "#111111" }, dark: { background: "#101018" } } })
		);
		expect(o.presets?.[0]?.colors?.light).toMatchObject({ text: "#111111" });
		expect(o.presets?.[0]?.colors?.dark).toMatchObject({ background: "#101018" });
		expect(() => defineTheme(o)).not.toThrow();
	});
});

describe("share code", () => {
	it("round-trips a rich state exactly", () => {
		const s = edit({
			base: "brutalism",
			brand: "#16a34a",
			brandDark: "#4ade80",
			scheme: "light",
			surface: "flat",
			radius: 0.2,
			density: 1.1,
			paper: "grid",
			fonts: { body: "Inter, sans-serif", mono: "monospace" },
			type: { label: { size: "12px", tracking: "0.04em", weight: 600 } },
			colors: { light: { text: "#101010" }, dark: {} },
			headingCase: "uppercase",
		});
		expect(decodeState(encodeState(s))).toEqual(s);
	});

	it("is tiny for a default theme and rejects garbage and other versions", () => {
		expect(encodeState(DEFAULT_STATE).length).toBeLessThan(12);
		expect(decodeState(encodeState(DEFAULT_STATE))).toEqual(DEFAULT_STATE);
		expect(decodeState("nope")).toBeNull();
		expect(decodeState("v9.e30")).toBeNull();
		expect(decodeState("v1.!!!")).toBeNull();
	});
});

describe("sanitizeState", () => {
	it("drops out-of-range and wrong-typed fields one by one without losing the valid ones", () => {
		const s = sanitizeState({
			brand: "#abcdef",
			radius: 99,
			density: "huge",
			scheme: "light",
			surface: 7,
		});
		expect(s.brand).toBe("#abcdef");
		expect(s.scheme).toBe("light");
		expect(s.radius).toBe(DEFAULT_STATE.radius);
		expect(s.density).toBe(DEFAULT_STATE.density);
		expect(s.surface).toBe(DEFAULT_STATE.surface);
	});

	it("never lets a declaration breakout reach CSS or generated code", () => {
		const s = sanitizeState({
			fonts: { body: "x; } body { display:none", mono: "a`b" },
			colors: { light: { text: "red; background: url(x)", border: "#fff" } },
			headingTracking: "1px}",
		});
		expect(s.fonts).toEqual({});
		expect(s.colors.light).toEqual({ border: "#fff" });
		expect(s.headingTracking).toBe("");
	});

	it("treats non-objects as the default", () => {
		expect(sanitizeState(null)).toEqual(DEFAULT_STATE);
		expect(sanitizeState("x")).toEqual(DEFAULT_STATE);
	});
});

describe("history", () => {
	const a = edit({ radius: 0.1 });
	const b = edit({ radius: 0.2 });
	const c = edit({ brand: "#000000" });

	it("undoes and redoes, and a new edit clears the redo stack", () => {
		let h = createHistory(DEFAULT_STATE);
		h = commit(h, a, "radius", 0);
		h = commit(h, c, "brand", 10_000);
		h = undo(h);
		expect(h.present).toEqual(a);
		h = redo(h);
		expect(h.present).toEqual(c);
		h = undo(undo(h));
		expect(h.present).toEqual(DEFAULT_STATE);
		h = commit(h, b, "radius", 20_000);
		expect(h.future).toEqual([]);
	});

	it("coalesces a drag of one control into a single undo step", () => {
		let h = createHistory(DEFAULT_STATE);
		for (let i = 1; i <= 20; i++) h = commit(h, edit({ radius: i / 10 }), "radius", i * 10);
		expect(h.past).toHaveLength(1);
		expect(undo(h).present).toEqual(DEFAULT_STATE);
		// a pause longer than the window starts a new step
		h = commit(h, edit({ radius: 0.05 }), "radius", 20 * 10 + COALESCE_MS + 1);
		expect(h.past).toHaveLength(2);
	});

	it("ignores a commit that changes nothing", () => {
		const h = createHistory(DEFAULT_STATE);
		expect(commit(h, structuredClone(DEFAULT_STATE), "x", 0)).toBe(h);
	});
});

describe("looks", () => {
	it("has distinct ids and compiles every look through the real engine", () => {
		expect(new Set(LOOKS.map((l) => l.id)).size).toBe(LOOKS.length);
		for (const l of LOOKS) {
			const css = themeCSS(defineTheme(toThemeOptions(l.state as StudioState)));
			expect(css, l.id).toContain('[data-preset="studio"]');
		}
	});

	it("does not lose authored role colors to sanitizing", () => {
		const tokyo = LOOKS.find((l) => l.id === "tokyo-night") as (typeof LOOKS)[number];
		const dark = (tokyo.state as StudioState).colors.dark;
		expect(dark.background).toBe("#1a1b26");
		expect(dark.sunken).toBe("#11121c");
		expect(dark.text).toBe("#c0caf5");
	});

	it("survives a share-code round trip", () => {
		for (const l of LOOKS)
			expect(decodeState(encodeState(l.state as StudioState))).toEqual(l.state);
	});
});

describe("fonts", () => {
	it("recognises the stack it printed and nothing else", () => {
		for (const f of FONTS) expect(familyOf(stackOf(f))?.id).toBe(f.id);
		expect(familyOf("Comic Sans MS, cursive")).toBeNull();
		expect(familyOf(undefined)).toBeNull();
	});
});
