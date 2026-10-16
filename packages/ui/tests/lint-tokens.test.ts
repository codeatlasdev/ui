import { describe, expect, it } from "bun:test";
import { lintSource } from "../scripts/lint-tokens.ts";

const rules = (file: string, src: string) => lintSource(file, src).map((v) => v.rule);

describe("lint-tokens", () => {
	it("flags will-change next to backdrop-filter, with the right line", () => {
		const v = lintSource(
			"styles/surface.css",
			".a {\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n}\n.b {\n  will-change: transform;\n}"
		);
		expect(v).toHaveLength(1);
		expect(v[0]).toMatchObject({ rule: "will-change", line: 6 });
	});

	it("ignores will-change when the file has no backdrop-filter, and ignores comments", () => {
		expect(rules("a.css", ".a { will-change: transform; }")).toEqual([]);
		expect(
			rules(
				"styles/surface.css",
				"/* will-change: transform */\n.a { backdrop-filter: blur(1px); }"
			)
		).toEqual([]);
	});

	it("flags will-change in a file that opts into a blur role or .ca-surface (#203)", () => {
		const blurred = '<div data-ca-blur="thick"></div><style>.a { will-change: transform; }</style>';
		expect(rules("A.svelte", blurred)).toEqual(["will-change"]);
		expect(
			rules("A.svelte", '<div class="ca-surface"></div><style>.a { will-change: opacity; }</style>')
		).toEqual(["will-change"]);
		expect(rules("A.svelte", "<div></div><style>.a { will-change: transform; }</style>")).toEqual(
			[]
		);
	});

	it("only reads <style> blocks of a .svelte file", () => {
		expect(
			rules("A.svelte", '<script>const will-change = 1; // 100vh\n</script><div style=""></div>')
		).toEqual([]);
		expect(rules("A.svelte", "<style>.a { height: 100dvh; }</style>")).toEqual(["viewport-unit"]);
	});

	it("flags literal viewport units but allows the token and harness files", () => {
		expect(rules("a.css", ".a { height: 100vh; }")).toEqual(["viewport-unit"]);
		expect(rules("a.css", ".a { min-height: 100svh; }")).toEqual(["viewport-unit"]);
		expect(rules("a.css", ".a { height: var(--ca-vh); width: 100vw; }")).toEqual([]);
		expect(rules("styles/tokens.css", ":root { --ca-vh: 100vh; }")).toEqual([]);
		expect(rules("X.test.svelte", "<style>.a { height: 100vh; }</style>")).toEqual([]);
	});

	it("flags the standard backdrop-filter declared before the prefixed one", () => {
		const bad = ".a {\n  backdrop-filter: blur(1px);\n  -webkit-backdrop-filter: blur(1px);\n}";
		expect(lintSource("styles/surface.css", bad)).toMatchObject([
			{ rule: "backdrop-order", line: 2 },
		]);
		expect(
			rules(
				"styles/surface.css",
				".a { -webkit-backdrop-filter: blur(1px); backdrop-filter: blur(1px); }"
			)
		).toEqual([]);
		// A lone standard declaration is fine; order only matters when both exist.
		expect(rules("styles/surface.css", ".a { backdrop-filter: blur(1px); }")).toEqual([]);
	});

	it("rejects backdrop-filter outside surface.css and materials.css (#203)", () => {
		const css = ".a { -webkit-backdrop-filter: blur(1px); backdrop-filter: blur(1px); }";
		const v = lintSource("components/Chip/Chip.svelte", `<style>\n${css}\n</style>`);
		// the prefixed and the standard declaration are both reported
		expect(v.map((x) => [x.rule, x.line])).toEqual([
			["backdrop-owner", 2],
			["backdrop-owner", 2],
		]);
		expect(v[0]?.message).toContain("data-ca-blur");
		expect(rules("a.css", ".a { backdrop-filter: none; }")).toEqual(["backdrop-owner"]);
		expect(rules("a.css", ".a::backdrop { -webkit-backdrop-filter: blur(4px); }")).toEqual([
			"backdrop-owner",
		]);
		// the two files that own the property
		expect(rules("packages/ui/src/lib/styles/surface.css", css)).toEqual([]);
		expect(rules("packages/ui/src/lib/styles/materials.css", css)).toEqual([]);
		// a different file that merely shares the name is not exempt
		expect(rules("components/Foo/surface.css.svelte", `<style>${css}</style>`)).toEqual([
			"backdrop-owner",
			"backdrop-owner",
		]);
		// prose, comments, custom properties and the role attribute are not declarations
		expect(rules("a.css", "/* backdrop-filter: blur(1px) */ .a { --ca-blur: blur(1px); }")).toEqual(
			[]
		);
		expect(rules("A.svelte", '<div data-ca-blur="thick">backdrop-filter</div>')).toEqual([]);
	});

	it("flags input font-size under 16px unless guarded by max()", () => {
		expect(rules("a.css", "input.x { font-size: 14px; }")).toEqual(["input-font-size"]);
		expect(rules("a.css", ".ca-field textarea { font-size: 15px; }")).toEqual(["input-font-size"]);
		expect(rules("a.css", "input { font-size: max(16px, 1em); }")).toEqual([]);
		expect(rules("a.css", "input { font-size: 16px; }")).toEqual([]);
		expect(rules("a.css", ".label { font-size: 12px; }")).toEqual([]);
	});

	it("flags prose inside svelte-ignore (Svelte reads it as codes and the warning returns)", () => {
		const bad = lintSource(
			"x.svelte",
			"<!-- svelte-ignore a11y_no_noninteractive_tabindex (scroll region) -->\n<div></div>"
		);
		expect(bad.map((x) => [x.rule, x.line])).toEqual([["svelte-ignore", 1]]);
		const ok = lintSource(
			"x.svelte",
			"<!-- why: scroll region -->\n<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->\n<script>\n// svelte-ignore state_referenced_locally\n</script>"
		);
		expect(ok).toEqual([]);
	});

	it("checks svelte-ignore codes in linear time (a long code before prose must not backtrack)", () => {
		const code = "a11y_no_noninteractive_element_interactions_and_more_words";
		const t0 = performance.now();
		const v = lintSource("x.svelte", `<!-- svelte-ignore ${code} (why) -->\n<div></div>`);
		expect(v.map((x) => x.rule)).toEqual(["svelte-ignore"]);
		expect(performance.now() - t0).toBeLessThan(50);
	});

	it("flags width breakpoints outside the shared scale", () => {
		const css =
			"@media (max-width: 767px) {} @media (min-width: 768px) {} @media (max-width: 899.98px) {} @media (min-width: 1200px) {}";
		const v = lintSource("x.css", css).filter((x) => x.rule === "breakpoint");
		expect(v.map((x) => x.message.split(":")[0])).toEqual(["(max-width", "(min-width"]);
		expect(lintSource("x.test.css", css).filter((x) => x.rule === "breakpoint")).toEqual([]);
	});

	it("allows any width in a container query: it measures a box, not the viewport scale", () => {
		const cq =
			"@container (min-width: 21.5rem) { .a { gap: 0; } } @container card (max-width: 33rem) {}";
		expect(lintSource("x.css", cq).filter((x) => x.rule === "breakpoint")).toEqual([]);
		const mixed = "@media (min-width: 21.5rem) {} @container (min-width: 21.5rem) {}";
		const v = lintSource("x.css", mixed).filter((x) => x.rule === "breakpoint");
		expect(v.map((x) => x.line)).toEqual([1]);
	});

	it("flags --ca-text-disabled used as color outside a disabled selector (#21)", () => {
		const bad = ".a { color: var(--ca-text-disabled); }";
		expect(rules("Foo.svelte", `<style>${bad}</style>`)).toEqual(["text-disabled"]);
		expect(rules("a.css", ".x:disabled { color: var(--ca-text-disabled); }")).toEqual([]);
		expect(rules("a.css", ".x[aria-disabled='true'] { color: var(--ca-text-disabled); }")).toEqual(
			[]
		);
		expect(rules("a.css", ".x[data-disabled] { color: var(--ca-text-disabled); }")).toEqual([]);
		expect(rules("a.css", ".x--disabled .y { color: var(--ca-text-disabled); }")).toEqual([]);
		// decorative markers are allowed explicitly
		expect(
			rules("styles/prose.css", ".prose li::marker { color: var(--ca-text-disabled); }")
		).toEqual([]);
		// de-emphasised information must use --ca-text-hint
		expect(rules("a.css", ".x { color: var(--ca-text-hint); }")).toEqual([]);
	});

	it("flags a literal --ca-brand-main in a focus rule (#24)", () => {
		expect(rules("a.css", ".a:focus-visible { outline: 2px solid var(--ca-brand-main); }")).toEqual(
			["focus-ring"]
		);
		expect(rules("a.css", ".a:focus-visible { outline: 2px solid var(--ca-focus-ring); }")).toEqual(
			[]
		);
		expect(rules("a.css", ".a:hover { border-color: var(--ca-brand-main); }")).toEqual([]);
	});
});
