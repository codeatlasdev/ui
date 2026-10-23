import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { guardSource } from "../src/cli/ui-guard.ts";

/**
 * #474: the recipes are copied whole into apps that run `codeatlas-ui lint`. A recipe that fails the
 * guard (`i18n-literal` first of all) teaches the wrong thing, so every svelte block of a recipe in
 * `CLEAN` is run through the guard, all rules, and must report nothing.
 *
 * `PENDING` are recipes still being moved to `src/lib/messages.ts` (see getting-started/app-copy).
 * A recipe leaves `PENDING` for `CLEAN` when it passes; a recipe in `PENDING` that already passes
 * fails the test, so the list only ever shrinks. A new recipe section must be in one of the two.
 */
const CLEAN = [
	"App shell",
	"List page",
	"Form page",
	"Settings page",
	"Auth pages",
	"Dashboard",
	"Map page",
	"Landing page",
	"Standalone page",
];
const PENDING: string[] = [];
const RECIPES = join(import.meta.dir, "../../../site/src/content/docs/getting-started/recipes.mdx");

interface Block {
	id: string;
	section: string;
	src: string;
	line: number;
}

function svelteBlocks(markdown: string): Block[] {
	const out: Block[] = [];
	const lines = markdown.split("\n");
	let section = "";
	let open: { start: number; lines: string[] } | undefined;
	lines.forEach((line, i) => {
		if (!open) {
			const h = line.match(/^## (.+)$/);
			if (h) section = h[1].trim();
			if (/^```svelte\s*$/.test(line)) open = { start: i + 2, lines: [] };
			return;
		}
		if (/^```\s*$/.test(line)) {
			const src = open.lines.join("\n");
			const name = src.match(/^<!-- (\S+) -->/)?.[1] ?? `${section}@${open.start}`;
			out.push({ id: name, section, src, line: open.start });
			open = undefined;
		} else open.lines.push(line);
	});
	return out;
}

const blocks = svelteBlocks(readFileSync(RECIPES, "utf8"));
const findings = (b: Block) =>
	guardSource("recipe.svelte", b.src, { allow: [] }).map(
		(v) => `${v.rule} line ${v.line}: ${v.message}`
	);

describe("recipes.mdx code blocks pass the UI guard (#474)", () => {
	it("finds the svelte blocks of every recipe", () => {
		expect(blocks.length).toBeGreaterThanOrEqual(8);
	});

	it("lists every recipe section that has a svelte block", () => {
		const sections = [...new Set(blocks.map((b) => b.section))];
		expect(sections.filter((s) => ![...CLEAN, ...PENDING].includes(s))).toEqual([]);
	});

	for (const b of blocks.filter((x) => CLEAN.includes(x.section)))
		it(`${b.section}: ${b.id}`, () => {
			expect(findings(b)).toEqual([]);
		});

	for (const b of blocks.filter((x) => PENDING.includes(x.section)))
		it(`pending ${b.section}: ${b.id} still fails (move it to CLEAN once it passes)`, () => {
			expect(findings(b).length).toBeGreaterThan(0);
		});
});
