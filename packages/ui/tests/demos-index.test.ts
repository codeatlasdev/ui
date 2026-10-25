import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { CATALOG } from "../../../site/src/demos/catalog.ts";
import { buildDemos, buildManifest, checkMeta, importedNames } from "../scripts/build-manifest.ts";
import {
	buildIndexFiles,
	facetCounts,
	indexEntries,
	publishedFacets,
} from "../scripts/index-build.ts";
import {
	AUDIT,
	checkIdRange,
	checkIndexFacets,
	ID_PATTERN,
	ID_RANGES,
	LEGACY_OUT_OF_RANGE,
	MAX_ERROR_RATE,
	PENDING_FACETS,
	rangeOf,
	SUBTYPES,
} from "../scripts/index-schema.ts";

const DEMOS = resolve(import.meta.dir, "../../../site/src/demos");
const manifest = buildManifest();
const { demos } = buildDemos(manifest, CATALOG);

const ok = {
	kind: "section",
	subtype: "pricing",
	industry: ["saas"],
	style: ["default", "bento"],
	motion: "expressive",
	interaction: ["hover", "scroll"],
	layout: "grid",
	colorMode: "both",
	density: "regular",
	tech: ["css", "svelte-motion"],
	cost: "js-light",
	components: ["Button"],
	aliases: ["plans"],
	related: ["001"],
	a11y: { reducedMotion: true, keyboard: true },
	added: "2026-10-25",
	review: Object.fromEntries(PENDING_FACETS.map((f) => [f, "pending"])),
};
const ctx = { known: new Set(["Button"]), ids: new Set(["001", "002"]), self: "002" };

describe("index facet schema", () => {
	it("accepts a complete block", () => {
		expect(checkIndexFacets(ok, ctx)).toEqual([]);
	});

	it("rejects a subtype that does not belong to the kind", () => {
		expect(checkIndexFacets({ ...ok, subtype: "input" }, ctx)[0]).toContain('for kind "section"');
		expect(checkIndexFacets({ ...ok, kind: "nope" }, ctx)[0]).toContain("index.kind");
	});

	it("rejects values outside the closed vocabulary, empty and duplicate lists", () => {
		expect(checkIndexFacets({ ...ok, industry: ["banking"] }, ctx)).toEqual([
			expect.stringContaining('"banking" is not one of'),
		]);
		expect(checkIndexFacets({ ...ok, style: [] }, ctx)[0]).toContain("index.style: at least 1");
		expect(checkIndexFacets({ ...ok, tech: ["css", "css"] }, ctx)).toContain(
			"index.tech: duplicate value"
		);
		expect(checkIndexFacets({ ...ok, layout: "masonry" }, ctx)[0]).toContain("index.layout");
		expect(checkIndexFacets({ ...ok, colorMode: "auto" }, ctx)[0]).toContain("index.colorMode");
	});

	it("rejects unknown components, dangling or self related ids and uppercase aliases", () => {
		expect(checkIndexFacets({ ...ok, components: ["Nope"] }, ctx)).toEqual([
			'index.components: "Nope" is not a library component',
		]);
		expect(checkIndexFacets({ ...ok, related: ["999"] }, ctx)).toEqual([
			'index.related: "999" is not a catalog id',
		]);
		expect(checkIndexFacets({ ...ok, related: ["002"] }, ctx)).toEqual([
			"index.related: a demo cannot relate to itself",
		]);
		expect(checkIndexFacets({ ...ok, aliases: ["Plans"] }, ctx)[0]).toContain("index.aliases");
	});

	it("rejects a bad date, a missing a11y flag and contradictory motion/cost/tech", () => {
		expect(checkIndexFacets({ ...ok, added: "25/10/2026" }, ctx)[0]).toContain("index.added");
		expect(checkIndexFacets({ ...ok, added: "2026-13-45" }, ctx)[0]).toContain("index.added");
		expect(checkIndexFacets({ ...ok, a11y: { reducedMotion: true } }, ctx)[0]).toContain(
			"index.a11y"
		);
		expect(checkIndexFacets({ ...ok, motion: "none", cost: "gpu" }, ctx)).toContain(
			'index: motion "none" cannot cost "gpu"'
		);
		expect(checkIndexFacets({ ...ok, tech: ["webgl"], cost: "js-light" }, ctx)).toContain(
			'index: tech "webgl" costs "gpu"'
		);
	});

	it("rejects unknown keys and non-objects", () => {
		expect(checkIndexFacets({ ...ok, mood: "calm" }, ctx)).toEqual(['index: unknown key "mood"']);
		expect(checkIndexFacets([], ctx)).toEqual(["index: object required"]);
	});

	it("checkMeta validates the block when a sidecar carries one", () => {
		const meta = {
			summary: "A pricing card with a button.",
			use: "Plan pickers on a pricing page.",
			spec: ["`Button`"],
			tags: ["pricing", "button"],
			shape: "wide",
		};
		expect(checkMeta({ ...meta, index: ok }, "<Button />", ctx)).toEqual([]);
		expect(checkMeta({ ...meta, index: { ...ok, motion: "wild" } }, "<Button />", ctx)).toEqual([
			expect.stringContaining("index.motion"),
		]);
	});
});

describe("id ranges", () => {
	it("blocks are well formed and never overlap within the same specificity", () => {
		for (const r of ID_RANGES) expect(r.from).toBeLessThanOrEqual(r.to);
		const specific = ID_RANGES.filter((r) => r.subtype !== "*");
		const whole = ID_RANGES.filter((r) => r.subtype === "*");
		for (const group of [specific, whole])
			for (const a of group)
				for (const b of group) if (a !== b) expect(a.to < b.from || b.to < a.from).toBe(true);
	});

	it("every subtype a range names exists for its kind", () => {
		for (const r of ID_RANGES) if (r.subtype !== "*") expect(SUBTYPES[r.kind]).toContain(r.subtype);
	});

	it("4-digit blocks follow the plan: sections 1000-2999 in blocks of 100 per subtype", () => {
		expect(rangeOf("1000")).toMatchObject({ kind: "section", subtype: "hero" });
		expect(rangeOf("1099")).toMatchObject({ kind: "section", subtype: "hero" });
		expect(rangeOf("1200")).toMatchObject({ kind: "section", subtype: "pricing" });
		expect(rangeOf("2500")).toMatchObject({ kind: "section", subtype: "*" });
		expect(rangeOf("3000")?.kind).toBe("background");
		expect(rangeOf("3400")?.kind).toBe("3d");
		expect(rangeOf("4000")?.kind).toBe("page");
		expect(rangeOf("3999")).toBeUndefined();
	});

	it("checks kind and subtype against the block of the id", () => {
		expect(checkIdRange("1001", "section", "hero")).toBeUndefined();
		expect(checkIdRange("1001", "section", "faq")).toContain('subtype "hero"');
		expect(checkIdRange("1001", "background", "gradient")).toContain('kind "section"');
		expect(checkIdRange("3999", "page", "landing")).toContain("outside every reserved range");
		expect(checkIdRange("340", "motion", "micro")).toBeUndefined();
		expect(checkIdRange("340", "motion", "text")).toContain('subtype "micro"');
	});

	it("ids keep 3 digits to 999 and use 4 from 1000", () => {
		for (const id of ["001", "999", "1000", "4999"]) expect(ID_PATTERN.test(id)).toBe(true);
		for (const id of ["1", "01", "0999", "10000", "abc"]) expect(ID_PATTERN.test(id)).toBe(false);
	});

	it("the legacy exemptions are exactly the ids sitting outside their kind's block", () => {
		const outside: Record<string, string> = {};
		for (const d of demos) {
			const r = rangeOf(d.id);
			if (r && r.kind !== d.index.kind) outside[d.id] = d.index.kind;
		}
		expect(outside).toEqual(LEGACY_OUT_OF_RANGE);
	});

	it("every registered demo sits in a reserved range for its own facets", () => {
		const bad = demos.flatMap((d) => {
			const e = checkIdRange(d.id, d.index.kind, d.index.subtype);
			return e ? [`#${d.id} ${e}`] : [];
		});
		expect(bad).toEqual([]);
	});
});

describe("backfilled facets", () => {
	it("components are the library imports of the demo source", () => {
		for (const d of demos) {
			const used = importedNames(d.source).filter((n) =>
				manifest.components.some((c) => c.name === n)
			);
			expect([...d.index.components].sort()).toEqual([...used].sort());
		}
	});

	it("tech and cost agree with what the source proves", () => {
		for (const d of demos) {
			if (/<canvas|getContext\(/.test(d.source)) expect(d.index.tech).toContain("canvas2d");
			if (/startViewTransition/.test(d.source)) expect(d.index.tech).toContain("view-transitions");
			if (d.index.tech.length === 1) expect(d.index.cost).toBe("css");
		}
	});

	it("added is the date the id first entered the catalog, never in the future", () => {
		const today = new Date().toISOString().slice(0, 10);
		for (const d of demos) expect(d.index.added <= today).toBe(true);
	});

	it("motion demos are never `none` and carry a motion subtype", () => {
		for (const d of demos.filter((x) => x.group === "motion")) {
			expect(d.index.kind).toBe("motion");
			expect(d.index.motion).not.toBe("none");
		}
	});

	it("no sidecar names an external site or product (originality rule)", () => {
		const banned =
			/landdding|modulify|motionin|scrolltide|godly|land-book|cta\.gallery|footer\.design|60fps|backgrounds\.supply|inspora|shadcn|aceternity|magicui|motion-primitives|uiverse|21st|spline|unicorn\.studio|component\.gallery/i;
		const hits = CATALOG.filter((d) =>
			banned.test(readFileSync(join(DEMOS, `${d.path}.meta.json`), "utf8"))
		);
		expect(hits.map((d) => d.path)).toEqual([]);
	});
});

describe("publishing gate", () => {
	const files = buildIndexFiles(demos, manifest.version);
	const index = JSON.parse(files["api/v1/index.json"]);

	it("a field is published only when its audited error rate is at most 5%", () => {
		for (const [field, a] of Object.entries(AUDIT.fields)) {
			const rate = a.wrong / a.checked;
			expect([field, rate <= MAX_ERROR_RATE ? "published" : "pending"]).toEqual([field, a.review]);
		}
	});

	it("pending fields are in the sidecar, marked, and absent from every public output", () => {
		expect(PENDING_FACETS.length).toBeGreaterThan(0);
		for (const d of demos) {
			for (const f of PENDING_FACETS) {
				expect(d.index[f]).toBeDefined();
				expect(d.index.review?.[f]).toBe("pending");
				expect(publishedFacets(d.index)).not.toHaveProperty(f);
			}
		}
		for (const e of index.entries) for (const f of PENDING_FACETS) expect(e).not.toHaveProperty(f);
		for (const f of PENDING_FACETS) {
			expect(index.facets).not.toHaveProperty(f);
			expect(files["gallery/001.md"]).not.toContain(`- ${f[0].toUpperCase()}${f.slice(1)}:`);
		}
	});

	it("published facets still reach the index and the twin", () => {
		const e = index.entries[0];
		for (const f of [
			"style",
			"motion",
			"interaction",
			"layout",
			"colorMode",
			"density",
			"aliases",
			"related",
		])
			expect(e).toHaveProperty(f);
		expect(index.facets.style).toBeDefined();
		expect(files["gallery/001.md"]).toContain("- Motion:");
	});

	it("the checker rejects a ledger that marks the wrong facets", () => {
		expect(checkIndexFacets({ ...ok, review: {} }, ctx)[0]).toContain(
			"must mark exactly the pending facets"
		);
		expect(checkIndexFacets({ ...ok, review: { style: "pending" } }, ctx)[0]).toContain(
			"must mark exactly"
		);
	});
});

describe("index output", () => {
	const files = buildIndexFiles(demos, manifest.version);
	const index = JSON.parse(files["api/v1/index.json"]);

	it("lists every demo once with its facets, in catalog order", () => {
		expect(index.count).toBe(CATALOG.length);
		expect(index.entries.map((e: { id: string }) => e.id)).toEqual(CATALOG.map((d) => d.id));
		const first = index.entries[0];
		expect(first).toMatchObject({
			id: demos[0].id,
			kind: demos[0].index.kind,
			title: demos[0].title,
		});
		expect(first.path).toBe(CATALOG[0].path);
	});

	it("facet counts add up to the entries", () => {
		const counts = facetCounts(indexEntries(demos));
		for (const facet of ["kind", "subtype", "motion", "layout", "colorMode", "density", "cost"])
			expect(Object.values(counts[facet]).reduce((a, b) => a + b, 0)).toBe(demos.length);
		expect(index.facets).toEqual(counts);
		for (const facet of ["style", "interaction", "tech"])
			expect(Object.values(counts[facet]).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(
				demos.length
			);
	});

	it("emits one markdown twin per id with facets, spec and source", () => {
		const twins = Object.keys(files).filter((f) => f.startsWith("gallery/"));
		expect(twins.sort()).toEqual(CATALOG.map((d) => `gallery/${d.id}.md`).sort());
		const d = demos[0];
		const md = files[`gallery/${d.id}.md`];
		expect(md).toContain(`# #${d.id} ${d.title}`);
		expect(md).toContain(`- Kind: ${d.index.kind} / ${d.index.subtype}`);
		expect(md).toContain(`- ${d.spec[0]}`);
		expect(md).toContain(d.source.trimEnd());
	});

	it("keeps index.json small enough to load once", () => {
		expect(Buffer.byteLength(files["api/v1/index.json"])).toBeLessThan(400_000);
	});

	it("the committed files are what the builder emits", () => {
		const site = resolve(import.meta.dir, "../../../site/public");
		for (const [name, body] of Object.entries(files))
			expect(readFileSync(join(site, name), "utf8")).toBe(body);
	});
});
