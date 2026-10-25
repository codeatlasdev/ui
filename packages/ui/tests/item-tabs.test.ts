import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildAnatomy, buildPrompt, type ItemRecord } from "../../../site/src/lib/item-tabs.ts";
import type { IndexEntry } from "../scripts/index-build.ts";

const root = join(import.meta.dir, "../../../site/public/api/v1");
const elements = (
	JSON.parse(readFileSync(join(root, "catalog.json"), "utf8")) as { elements: ItemRecord[] }
).elements;
const entries = (
	JSON.parse(readFileSync(join(root, "index.json"), "utf8")) as { entries: IndexEntry[] }
).entries;
const fade = elements.find((e) => e.id === "256") as ItemRecord;
const fadeEntry = entries.find((e) => e.id === "256");

describe("item prompt", () => {
	it("names the demo, the fetch call, the library parts and the exact timing", () => {
		const p = buildPrompt(fade, fadeEntry);
		expect(p).toContain('get_demo({ ids: ["#256"] })');
		expect(p).toContain("MotionStage");
		expect(p).toContain(
			"opacity, transform: translateY: 420ms, cubic-bezier(0.2, 0, 0, 1), delay 80ms"
		);
		expect(p).toContain("Reduced motion: the demo handles it");
	});

	it("never mentions a facet that is not published", () => {
		for (const e of elements.slice(0, 60)) {
			const p = buildPrompt(
				e,
				entries.find((x) => x.id === e.id)
			);
			expect(p.toLowerCase()).not.toContain("industry");
			expect(p).toContain(`#${e.id}`);
		}
	});

	it("states keyboard behaviour from the index, not a guess", () => {
		const interactive = entries.find((e) => e.a11y?.keyboard) as IndexEntry;
		const rec = elements.find((e) => e.id === interactive.id) as ItemRecord;
		expect(buildPrompt(rec, interactive)).toContain("Keyboard: operable");
		const still = entries.find((e) => !e.a11y?.keyboard) as IndexEntry;
		const rec2 = elements.find((e) => e.id === still.id) as ItemRecord;
		expect(buildPrompt(rec2, still)).toContain("Keyboard: not an interactive control");
	});
});

describe("item anatomy", () => {
	const slugs = new Map([["card", "display/card"]]);
	it("lists every component with its package and links only when a docs page exists", () => {
		const parts = buildAnatomy(fade, slugs);
		expect(parts.map((p) => p.name)).toEqual(fade.components);
		const card = parts.find((p) => p.name === "Card");
		expect(card?.href).toBe("/docs/display/card/");
		expect(card?.from).toBe("@codeatlasdev/ui");
		expect(parts.find((p) => p.name === "MotionStage")?.href).toBeUndefined();
	});

	it("kebab-cases multi-word names when matching a docs slug", () => {
		const rec = { ...fade, components: ["DataTable"], imports: [] };
		expect(buildAnatomy(rec, new Map([["data-table", "display/data-table"]]))[0].href).toBe(
			"/docs/display/data-table/"
		);
	});
});
