import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const prose = read("../src/lib/styles/prose.css");

describe("prose.css heading anchor on touch screens (#147)", () => {
	it("never hides the anchor behind (hover: none)", () => {
		const blocks = [...prose.matchAll(/@media \(hover: none\)\s*\{([^}]*\{[^}]*\}[^}]*)\}/g)].map(
			(m) => m[1] ?? ""
		);
		const anchorRules = blocks.filter((b) => b.includes(".ca-prose-anchor"));
		expect(anchorRules.length).toBeGreaterThan(0);
		for (const b of anchorRules) expect(b).not.toMatch(/display:\s*none/);
		expect(anchorRules.join("")).toMatch(/opacity:\s*1/);
	});
});

describe("release lists guide (#147)", () => {
	const guide = read("../../../site/src/content/docs/docs-kit/release-lists.mdx");
	it("documents every ca-release class prose.css styles", () => {
		const classes = new Set(
			[...prose.matchAll(/\.(ca-release[\w-]*)/g)].map((m) => m[1] as string)
		);
		expect(classes.size).toBeGreaterThan(3);
		for (const c of classes) expect(guide).toContain(c);
	});
	it("states who generates the ids linking the jump index to the headings", () => {
		expect(guide).toMatch(/slug/i);
		expect(guide).toMatch(/aria-labelledby/);
	});
});

describe("prose.css code inside a pre (#468)", () => {
	// A fenced block is `<pre><code>`. The UA sheet gives `code` a bare `font-family: monospace`, which
	// Chromium resolves through fontconfig differently from one lookup to the next (DejaVu Sans Mono
	// before a full-page capture, Liberation Mono after), so a block changed height by a line-height
	// step. Every `code` must carry the pinned stack itself.
	it("gives every code, fences included, the pinned mono stack", () => {
		const rule = prose.match(/\.ca-prose code,\s*\.ca-code code\s*\{([^}]*)\}/);
		expect(rule?.[1]).toMatch(/font-family:\s*var\(--ca-font-mono\)/);
	});
});
