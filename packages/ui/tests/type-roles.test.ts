import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { defineTheme, themeCSS } from "../src/lib/theme/define.js";
import { designStyle, mergeTheme } from "../src/lib/theme/styles.js";

// #375: a named type scale by role (title, heading, body, label, caption, num). Each role is a
// size / leading / tracking / weight bundle, overridable by ThemeOptions.type, and the legacy
// size tokens that components read are derived from the roles, so one override moves both.
const LIB = new URL("../src/lib/", import.meta.url);
const read = (p: string) => readFileSync(new URL(p, LIB), "utf8");
const tokensCss = read("styles/tokens.css");
const utilitiesCss = read("styles/type-roles.css");

const ROLES = ["title", "heading", "body", "label", "caption", "num"] as const;
const PARTS = ["size", "leading", "tracking", "weight"] as const;

/** Declarations of the `:root, [data-ca-tokens]` derived block and of the first `:root` block. */
function decls(source: string): Record<string, string> {
	const out: Record<string, string> = {};
	const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
	for (const d of css.matchAll(/(--ca-[\w-]+):\s*([^;]+);/g)) out[d[1]] ??= d[2].trim();
	return out;
}
const tokens = decls(tokensCss);
const shorthands = decls(read("styles/type-roles.css"));

describe("role tokens (#375)", () => {
	it("every part of every role resolves through a fallback or a legacy token", () => {
		// No default is shipped as a `--ca-text-*` token: each part falls back to the token it equals,
		// and body/label/caption size and label tracking are the tokens components already read.
		const legacy: Record<string, string> = {
			body: "--ca-font-size-body1",
			label: "--ca-font-size-label",
			caption: "--ca-font-size-caption",
		};
		for (const role of ROLES) {
			const v = shorthands[`--ca-text-${role}`] ?? "";
			const size = legacy[role]
				? `var(${legacy[role]})`
				: `var(--ca-text-${role}-size, var(--ca-font-size-`;
			expect(v, `${role} size`).toContain(size);
			for (const part of ["weight", "leading"])
				expect(v, `${role} ${part}`).toContain(`var(--ca-text-${role}-${part}, var(--ca-`);
		}
	});

	it("the role override writes the token components already read, defaults unchanged", () => {
		// No second source: the size of body, label and caption, and the label tracking, are the
		// legacy tokens at their original values; `type.<role>` sets those same tokens.
		expect(tokens["--ca-font-size-body1"]).toBe("calc(0.9375rem * var(--ca-font-scale))");
		expect(tokens["--ca-font-size-label"]).toBe("calc(0.8125rem * var(--ca-font-scale))");
		expect(tokens["--ca-font-size-caption"]).toBe("calc(0.75rem * var(--ca-font-scale))");
		expect(tokens["--ca-label-tracking"]).toBe("0.01em");
	});

	it("num is tabular and has no leading shift: its utility sets tabular-nums", () => {
		expect(utilitiesCss).toMatch(/\.ca-text-num\s*\{[^}]*font-variant-numeric:\s*tabular-nums/);
	});

	it("ships a utility per role, in the utilities layer file", () => {
		for (const role of ROLES) {
			const rule = new RegExp(`\\.ca-text-${role}\\s*\\{([^}]*)\\}`).exec(utilitiesCss)?.[1] ?? "";
			expect(rule, role).toContain(`font: var(--ca-text-${role})`);
			expect(rule, role).toContain(
				`letter-spacing: var(--ca-${role === "label" ? "label" : `text-${role}`}-tracking`
			);
		}
	});
});

describe("ThemeOptions.type (#375)", () => {
	it("defaults emit nothing", () => {
		expect(themeCSS(defineTheme({}))).toBe("");
		expect(themeCSS(defineTheme({ type: {} }))).toBe("");
	});

	it("emits only the fields that are set, on :root", () => {
		const css = themeCSS(
			defineTheme({
				type: { label: { size: "13px", leading: 1.25, tracking: "0", weight: 500 } },
			})
		);
		expect(css).toContain("--ca-font-size-label: 13px;");
		expect(css).toContain("--ca-text-label-leading: 1.25;");
		expect(css).toContain("--ca-label-tracking: 0;");
		expect(css).toContain("--ca-text-label-weight: 500;");
		expect(css).not.toContain("--ca-font-size-caption");
		expect(css).toMatch(/^:root,\s*\n\[data-theme-scope="light"\] \{/);
	});

	it("a partial role keeps the other parts at their defaults", () => {
		const css = themeCSS(defineTheme({ type: { caption: { tracking: "0.005em" } } }));
		expect(css).toContain("--ca-text-caption-tracking: 0.005em;");
		expect(css).not.toContain("--ca-font-size-caption");
	});

	it("the size follows --ca-font-scale: a unit-less number is a rem multiple, a length is used as written", () => {
		const css = themeCSS(defineTheme({ type: { num: { size: "0.875rem" } } }));
		expect(css).toContain("--ca-text-num-size: 0.875rem;");
	});

	it("rejects an unknown role and values that would break out of a declaration", () => {
		expect(() => themeCSS(defineTheme({ type: { shout: { size: "1rem" } } as never }))).toThrow(
			/type\.shout/
		);
		expect(() => themeCSS(defineTheme({ type: { label: { size: "1rem; color: red" } } }))).toThrow(
			/type\.label\.size/
		);
		expect(() => themeCSS(defineTheme({ type: { label: { weight: 0 } } }))).toThrow(
			/type\.label\.weight/
		);
		expect(() => themeCSS(defineTheme({ type: { label: { leading: -1 } } }))).toThrow(
			/type\.label\.leading/
		);
	});
});

describe("type merges through recipes (#375)", () => {
	it("mergeTheme keeps the roles of both sides and lets b win per part", () => {
		const t = mergeTheme(
			{ type: { label: { size: "12px", weight: 600 }, num: { weight: 700 } } },
			{ type: { label: { size: "14px" }, caption: { tracking: "0.02em" } } }
		);
		expect(t.type).toEqual({
			label: { size: "14px", weight: 600 },
			num: { weight: 700 },
			caption: { tracking: "0.02em" },
		});
	});

	it("designStyle keeps an app's type on top of the recipe", () => {
		const css = themeCSS(defineTheme(designStyle("swiss", { type: { num: { weight: 700 } } })));
		expect(css).toContain("--ca-text-num-weight: 700;");
	});
});
