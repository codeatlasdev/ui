import { describe, expect, it } from "bun:test";
import { lintSource } from "../scripts/lint-tokens.ts";

const rules = (file: string, src: string) => lintSource(file, src).map((v) => v.rule);

describe("lint-tokens", () => {
	it("flags will-change next to backdrop-filter, with the right line", () => {
		const v = lintSource(
			"a.css",
			".a {\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n}\n.b {\n  will-change: transform;\n}"
		);
		expect(v).toHaveLength(1);
		expect(v[0]).toMatchObject({ rule: "will-change", line: 6 });
	});

	it("ignores will-change when the file has no backdrop-filter, and ignores comments", () => {
		expect(rules("a.css", ".a { will-change: transform; }")).toEqual([]);
		expect(
			rules("a.css", "/* will-change: transform */\n.a { backdrop-filter: blur(1px); }")
		).toEqual([]);
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
		expect(lintSource("a.css", bad)).toMatchObject([{ rule: "backdrop-order", line: 2 }]);
		expect(
			rules("a.css", ".a { -webkit-backdrop-filter: blur(1px); backdrop-filter: blur(1px); }")
		).toEqual([]);
		// A lone standard declaration is fine; order only matters when both exist.
		expect(rules("a.css", ".a { backdrop-filter: blur(1px); }")).toEqual([]);
	});

	it("flags input font-size under 16px unless guarded by max()", () => {
		expect(rules("a.css", "input.x { font-size: 14px; }")).toEqual(["input-font-size"]);
		expect(rules("a.css", ".ca-field textarea { font-size: 15px; }")).toEqual(["input-font-size"]);
		expect(rules("a.css", "input { font-size: max(16px, 1em); }")).toEqual([]);
		expect(rules("a.css", "input { font-size: 16px; }")).toEqual([]);
		expect(rules("a.css", ".label { font-size: 12px; }")).toEqual([]);
	});
});
