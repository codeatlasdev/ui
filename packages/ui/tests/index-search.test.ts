import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { IndexEntry } from "../scripts/index-build.ts";
import {
	chipCounts,
	haystack,
	parseFilters,
	relatedEntries,
	searchIndex,
	writeFilters,
} from "../scripts/index-search.ts";

const entries: IndexEntry[] = (
	JSON.parse(
		readFileSync(join(import.meta.dir, "../../../site/public/api/v1/index.json"), "utf8")
	) as {
		entries: IndexEntry[];
	}
).entries;

describe("index search over the real index.json", () => {
	it("never exposes an unreviewed facet", () => {
		expect(entries.length).toBeGreaterThan(300);
		expect(entries.every((e) => !("industry" in e))).toBe(true);
	});

	it("filters by one facet and ORs its values", () => {
		const one = searchIndex(entries, { filters: { kind: ["motion"] } });
		expect(one.length).toBeGreaterThan(0);
		expect(one.every((e) => e.kind === "motion")).toBe(true);
		const both = searchIndex(entries, { filters: { kind: ["motion", "component"] } });
		expect(both.length).toBe(entries.length);
	});

	it("ANDs different facets and a query", () => {
		const hits = searchIndex(entries, {
			query: "button",
			filters: { kind: ["component"], motion: ["subtle"] },
		});
		expect(hits.length).toBeGreaterThan(0);
		for (const e of hits) {
			expect(e.kind).toBe("component");
			expect(e.motion).toBe("subtle");
			expect(haystack(e)).toContain("button");
		}
	});

	it("forgives case and separators and ranks a title hit first", () => {
		const hits = searchIndex(entries, { query: "APP list" });
		expect(hits.length).toBeGreaterThan(0);
		expect(squashTitle(hits[0])).toContain("applist");
	});

	it("returns nothing for an impossible combination", () => {
		expect(searchIndex(entries, { query: "zzzqqq" })).toEqual([]);
	});

	it("chip counts ignore the facet's own choice and match the result size", () => {
		const filters = { kind: ["motion"], motion: ["expressive"] };
		const counts = chipCounts(entries, { filters });
		// Siblings of `motion` stay selectable: the count is for kind=motion plus that value.
		const motionOnly = searchIndex(entries, { filters: { kind: ["motion"] } });
		expect(counts.motion.subtle ?? 0).toBe(motionOnly.filter((e) => e.motion === "subtle").length);
		const total = searchIndex(entries, { filters });
		expect(counts.motion.expressive).toBe(total.length);
		// A value that cannot occur with the other choices has no count (a disabled chip).
		expect(counts.kind.component ?? 0).toBe(
			searchIndex(entries, { filters: { motion: ["expressive"], kind: ["component"] } }).length
		);
	});

	it("round-trips filters through the URL and keeps other params", () => {
		const params = new URLSearchParams("pick=001&kind=old");
		writeFilters(params, { kind: ["motion"], style: ["aurora", "bento"] });
		expect(params.get("pick")).toBe("001");
		expect(params.get("kind")).toBe("motion");
		expect(parseFilters(params)).toEqual({ kind: ["motion"], style: ["aurora", "bento"] });
		writeFilters(params, {});
		expect(params.toString()).toBe("pick=001");
		expect(parseFilters(new URLSearchParams("kind=,&bogus=1"))).toEqual({});
	});

	it("related: named ids first, never itself", () => {
		const withRelated = entries.find((e) => (e.related ?? []).length > 0);
		if (!withRelated) throw new Error("no entry has related ids");
		const rel = relatedEntries(entries, withRelated.id);
		expect(rel.length).toBeGreaterThan(0);
		expect(rel.some((e) => e.id === withRelated.id)).toBe(false);
		expect(rel[0].id).toBe((withRelated.related as string[])[0]);
		expect(relatedEntries(entries, "nope")).toEqual([]);
	});
});

function squashTitle(e: IndexEntry) {
	return e.title.toLowerCase().replace(/[\s_-]/g, "");
}
