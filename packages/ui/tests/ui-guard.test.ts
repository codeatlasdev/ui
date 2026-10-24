import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { guardSource, runGuard } from "../src/cli/ui-guard.ts";
import { cleanTmp, tmpDir } from "./tmp";

afterAll(cleanTmp);

const rules = (file: string, src: string, allow: string[] = []) =>
	guardSource(file, src, { allow }).map((v) => `${v.rule}:${v.line}`);

describe("ui guard: styles", () => {
	it("flags a hex color in a style block and in a .css file, with the line", () => {
		expect(rules("A.svelte", "<p>x</p>\n<style>\n  .a { color: #ff0000; }\n</style>")).toEqual([
			"hex:3",
		]);
		expect(rules("app.css", ".a {\n  background: #fff;\n}")).toEqual(["hex:2"]);
	});

	it("flags a raw px size but not 0px, 1px hairlines, media queries or a token fallback", () => {
		expect(rules("app.css", ".a { padding: 12px; }")).toEqual(["px:1"]);
		expect(
			rules("app.css", ".a { border: 1px solid var(--ca-outline-default); margin: 0px; }")
		).toEqual([]);
		expect(rules("app.css", "@media (min-width: 900px) { .a { color: red } }")).toEqual([]);
		expect(rules("app.css", ".a { padding: var(--ca-space-3, 12px); }")).toEqual([]);
	});

	it("flags an inline style attribute that sets anything but a custom property", () => {
		expect(rules("A.svelte", '<div style="padding: 20px">x</div>')).toEqual(["inline-style:1"]);
		expect(rules("A.svelte", '<div style="--bar-w:{pct}%">x</div>')).toEqual([]);
	});

	it("flags :global(.ca-*) outside the allow-list and accepts it inside", () => {
		const src = "<style>\n:global(.ca-btn) { height: var(--ca-space-10); }\n</style>";
		expect(rules("A.svelte", src)).toEqual(["global-ca:2"]);
		expect(
			rules("src/lib/overrides.css", ":global(.ca-btn) { height: var(--ca-space-10); }", [
				"src/lib/overrides.css",
			])
		).toEqual([]);
	});

	it("a ca-ui-workaround marker on the line or above excuses any rule", () => {
		expect(
			rules("app.css", "/* ca-ui-workaround(#12): no token for this */\n.a { color: #123456; }")
		).toEqual([]);
	});

	it("ignores comments", () => {
		expect(
			rules("app.css", "/* color: #fff; padding: 12px */\n.a { color: var(--ca-text-primary); }")
		).toEqual([]);
	});
});

describe("ui guard: strings in markup", () => {
	it("flags visible text written in a .svelte template, not text from a function", () => {
		expect(rules("A.svelte", "<h1>Welcome back</h1>")).toEqual(["i18n-literal:1"]);
		expect(rules("A.svelte", "<h1>{t.welcome}</h1>")).toEqual([]);
		expect(rules("A.svelte", '<Button label="Save changes" />')).toEqual(["i18n-literal:1"]);
		expect(rules("A.svelte", "<Button label={t.save} />")).toEqual([]);
	});

	it("ignores code, numbers, symbols and attributes that are not text", () => {
		expect(
			rules(
				"A.svelte",
				'<script>const a = "Hello there";</script>\n<div class="a b" id="x" data-x="Some text">{n}</div>'
			)
		).toEqual([]);
		expect(rules("A.svelte", "<span>12</span><span>—</span>")).toEqual([]);
	});

	it("reads only .svelte and .astro for text", () => {
		expect(rules("a.ts", "const s = '<h1>Welcome back</h1>';")).toEqual([]);
	});
});

describe("runGuard", () => {
	const setup = (files: Record<string, string>) => {
		const dir = tmpDir("ca-guard-");
		for (const [p, c] of Object.entries(files)) {
			mkdirSync(dirname(join(dir, p)), { recursive: true });
			writeFileSync(join(dir, p), c);
		}
		return dir;
	};

	it("prints file:line rule message and exits 1 when something is flagged", () => {
		const dir = setup({ "src/a.css": ".a { color: #f00 }\n" });
		const lines: string[] = [];
		expect(runGuard(["src"], { cwd: dir, log: (l) => lines.push(l) })).toBe(1);
		expect(lines.join("\n")).toContain("src/a.css:1 hex");
	});

	it("exits 0 on a clean tree and skips node_modules", () => {
		const dir = setup({
			"src/a.css": ".a { color: var(--ca-text-primary) }\n",
			"src/node_modules/x/b.css": ".a { color: #fff }\n",
		});
		expect(runGuard(["src"], { cwd: dir, log: () => {} })).toBe(0);
	});

	it("takes the allow-list from the options", () => {
		const dir = setup({ "src/o.css": ":global(.ca-btn) { height: var(--ca-space-10) }\n" });
		expect(runGuard(["src"], { cwd: dir, allow: ["src/o.css"], log: () => {} })).toBe(0);
		expect(runGuard(["src"], { cwd: dir, log: () => {} })).toBe(1);
	});
});
