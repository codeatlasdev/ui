import { describe, expect, it } from "bun:test";
import {
	CATEGORIES,
	checkAtlas,
	facetCounts,
	filterTerms,
	getTerm,
	guidance,
	STYLE_PAGES,
	styleHref,
	stylesFor,
	TERMS,
	termPrompt,
	termReferences,
	termSlug,
} from "../../../site/src/data/atlas/atlas.ts";
import { BANNED_PHRASES } from "../../../site/src/data/evidence/references.ts";
import { STYLE_PAGE_IDS } from "../../../site/src/data/styles/styles.ts";
import { DESIGN_STYLES } from "../src/lib/theme/styles.ts";

// The design atlas dataset: the schema, the labelled caveats and the links to references and design styles.
// Rules of reading: site/src/content/docs/concepts/evidence.mdx.

describe("atlas dataset", () => {
	it("has the 269 terms of the taxonomy and passes every structural rule", () => {
		expect(TERMS).toHaveLength(269);
		expect(checkAtlas(TERMS)).toEqual([]);
	});

	it("numbers the terms DS001 to DS269 without gaps", () => {
		expect(TERMS.map((t) => t.id)).toEqual(
			Array.from({ length: 269 }, (_, i) => `DS${String(i + 1).padStart(3, "0")}`)
		);
	});

	it("uses every category and each of them at least once", () => {
		const seen = new Set(TERMS.map((t) => t.category));
		expect([...seen].sort()).toEqual([...CATEGORIES].sort());
	});

	it("rejects a score outside 1-5, an unknown source and a duplicate slug", () => {
		const base = TERMS[0];
		const bad = checkAtlas([
			{ ...base, scores: { ...base.scores, density: 6 } },
			{ ...TERMS[1], refs: ["E99"] },
			{ ...TERMS[2], id: "DS900", term: base.term },
		]);
		expect(bad.some((e) => e.includes("score density"))).toBe(true);
		expect(bad.some((e) => e.includes("unknown reference E99"))).toBe(true);
		expect(bad.some((e) => e.includes("also used by DS001"))).toBe(true);
	});

	it("never claims proof", () => {
		const text = JSON.stringify(TERMS).toLowerCase();
		for (const b of BANNED_PHRASES) expect(text).not.toContain(b);
	});

	it("describes an audience by motivation or task, never by age or gender", () => {
		// A term made FOR a user group (Kids UI) may name it; a style's audience may not.
		const forAGroup = new Set(["DS162"]);
		const group =
			/\b(millennials?|gen ?z|boomers?|teen(ager)?s?|youth|young|elderly|seniors?|older|women|men|girls|boys|females?|males?|gamers)\b/i;
		const hits = TERMS.filter((t) => !forAGroup.has(t.id) && group.test(t.audience)).map(
			(t) => `${t.id}: ${t.audience}`
		);
		expect(hits).toEqual([]);
	});

	it("keeps the exploratory-evidence label on every Future / AI term that asks for governance", () => {
		const emerging = TERMS.filter((t) => t.evidence === "emerging");
		expect(emerging.length).toBeGreaterThan(30);
		expect(emerging.every((t) => t.category === "Future / AI")).toBe(true);
	});
});

describe("atlas links", () => {
	it("gives every design style recipe terms that exist", () => {
		for (const s of Object.values(DESIGN_STYLES)) {
			expect(s.taxonomy.length).toBeGreaterThan(0);
			for (const id of s.taxonomy) expect(getTerm(id)?.id).toBe(id);
		}
	});

	it("finds the recipes that implement a term", () => {
		expect(stylesFor("DS001").map((s) => s.id)).toContain("swiss");
		expect(stylesFor("DS269")).toEqual([]);
	});

	it("links a design style only to a page that exists", () => {
		for (const s of Object.values(DESIGN_STYLES)) {
			const href = styleHref(s.id);
			expect(href === null || (STYLE_PAGES.has(s.id) && href === `/styles/${s.id}/`)).toBe(true);
		}
		expect(styleHref("not-a-style")).toBeNull();
	});

	it("every design style that has a page is linked to it from the atlas", () => {
		expect(STYLE_PAGE_IDS.length).toBeGreaterThan(0);
		for (const id of STYLE_PAGE_IDS) {
			expect(STYLE_PAGES.has(id)).toBe(true);
			expect(styleHref(id)).toBe(`/styles/${id}/`);
		}
		expect(STYLE_PAGES.size).toBe(STYLE_PAGE_IDS.length);
	});

	it("resolves every term to full references with a read source", () => {
		for (const t of TERMS)
			for (const r of termReferences(t)) expect(r.verified.date).toMatch(/^\d{4}-/);
	});
});

describe("atlas facets", () => {
	it("filters by category, status, a score range and text, together", () => {
		const swiss = filterTerms(TERMS, { query: "swiss" });
		expect(swiss.map((t) => t.id)).toContain("DS001");
		const calm = filterTerms(TERMS, { category: "Aesthetic", density: [1, 2], complexity: [1, 2] });
		expect(calm.length).toBeGreaterThan(0);
		for (const t of calm) {
			expect(t.category).toBe("Aesthetic");
			expect(t.scores.density).toBeLessThanOrEqual(2);
			expect(t.scores.complexity).toBeLessThanOrEqual(2);
		}
		expect(filterTerms(TERMS, { query: "zzzz-no-such-term" })).toEqual([]);
	});

	it("counts every term once per facet", () => {
		for (const key of ["category", "status", "trend", "standardization"] as const)
			expect([...facetCounts(TERMS, key).values()].reduce((a, b) => a + b, 0)).toBe(269);
	});

	it("gives every term a unique page slug", () => {
		expect(new Set(TERMS.map(termSlug)).size).toBe(269);
		expect(termSlug({ term: "Ma-Inspired Design" })).toBe("ma-inspired-design");
	});
});

describe("term page prose", () => {
	const swiss = TERMS[0];

	it("composes guidance from the term's own fields and always asks for validation", () => {
		const g = guidance(swiss);
		expect(g.whenToUse).toContain(swiss.sectors[0].toLowerCase());
		expect(g.whenNot).toContain(swiss.risk.charAt(0).toLowerCase());
		expect(g.validate).toMatch(/baseline/);
	});

	it("tells the model to compare and not to claim the style performs better", () => {
		const p = termPrompt(swiss);
		expect(p).toContain(swiss.term);
		expect(p).toContain("WCAG 2.2 AA");
		expect(p).toContain("Do not claim the style performs better");
		expect(p).toContain('designStyle("swiss")');
		expect(termPrompt(TERMS[268])).not.toContain("designStyle(");
	});
});
