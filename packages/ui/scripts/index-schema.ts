/**
 * The gallery index: the facets every demo carries in its `Variant.meta.json` under the `index` key,
 * the closed vocabulary they draw from, and the 4-digit id ranges reserved per kind.
 *
 * One module owns the schema: `checkMeta` (build-manifest.ts) validates with `checkIndexFacets`,
 * `scripts/index-backfill.ts` writes with the same vocabulary, and `buildIndex` reads the result.
 */
import { DESIGN_STYLES } from "../src/lib/theme/styles.ts";

export const KINDS = [
	"component",
	"section",
	"page",
	"motion",
	"background",
	"technique",
	"3d",
	"shader",
	"style",
	"template",
] as const;
export type Kind = (typeof KINDS)[number];

/** Allowed `subtype` values per kind (a closed list, so the facet chips stay stable and countable). */
export const SUBTYPES: Record<Kind, readonly string[]> = {
	component: [
		"input",
		"display",
		"feedback",
		"navigation",
		"surface",
		"layout",
		"chart",
		"media",
		"foundation",
		"map",
	],
	section: [
		"hero",
		"logos",
		"feature",
		"bento",
		"how-it-works",
		"stats",
		"testimonial",
		"pricing",
		"comparison",
		"faq",
		"cta",
		"newsletter",
		"team",
		"careers",
		"changelog",
		"blog-list",
		"contact",
		"integrations",
		"showcase",
		"footer",
		"navbar",
		"banner",
		"empty",
	],
	page: [
		"landing",
		"pricing",
		"about",
		"blog-post",
		"blog-index",
		"changelog",
		"docs",
		"auth",
		"dashboard",
		"settings",
		"checkout",
		"product",
		"portfolio",
		"waitlist",
		"legal",
		"error",
	],
	motion: [
		"basics",
		"text",
		"scroll",
		"micro",
		"transition",
		"ambient",
		"gesture",
		"cursor",
		"loading",
		"celebration",
	],
	background: [
		"gradient",
		"aurora",
		"grid",
		"noise",
		"pattern",
		"beams",
		"particles",
		"shader-field",
		"ascii",
		"image-treatment",
	],
	technique: [
		"glass",
		"spotlight",
		"border-beam",
		"mask-reveal",
		"tilt",
		"parallax",
		"marquee",
		"sticky-stack",
		"magnetic",
		"progressive-blur",
		"duotone",
		"kinetic-type",
	],
	"3d": ["globe", "card-stack", "turntable", "carousel-wall", "terrain", "particle-object"],
	shader: ["gradient-field", "distortion", "noise-flow", "dither", "ripple", "refraction"],
	style: ["concept"],
	template: ["multi-page"],
};

export const INDUSTRIES = [
	"saas",
	"ai",
	"devtools",
	"fintech",
	"e-commerce",
	"health",
	"education",
	"agency",
	"portfolio",
	"media",
	"travel",
	"food",
	"real-estate",
	"nonprofit",
	"gaming",
	"crypto",
	"general",
] as const;
/** `designStyle` ids plus the recipes the index adds ahead of their pages. */
export const STYLES_VOCAB: readonly string[] = [
	...Object.keys(DESIGN_STYLES),
	"minimal",
	"maximal",
	"skeuo",
	"aurora",
	"luxe",
	"pixel",
	"memphis",
	"flat",
	"organic",
];
export const MOTION_LEVELS = ["none", "subtle", "expressive", "immersive"] as const;
export const INTERACTIONS = [
	"hover",
	"press",
	"drag",
	"scroll",
	"cursor",
	"keyboard",
	"gyroscope",
	"none",
] as const;
export const LAYOUTS = [
	"single-column",
	"split",
	"grid",
	"bento",
	"stack",
	"carousel",
	"full-bleed",
	"sticky",
	"overlay",
] as const;
export const COLOR_MODES = ["light", "dark", "both"] as const;
export const DENSITIES = ["compact", "regular", "airy"] as const;
export const TECHS = [
	"css",
	"svelte-motion",
	"canvas2d",
	"svg-filter",
	"webgl",
	"view-transitions",
] as const;
export const COSTS = ["css", "js-light", "gpu"] as const;

/** The facets of one demo, stored in its sidecar as `"index": {…}`. Title, summary, id and path come from elsewhere. */
export interface IndexFacets {
	kind: Kind;
	subtype: string;
	industry: string[];
	style: string[];
	/** How much the demo moves: none · subtle (state change) · expressive (entrance/scroll) · immersive (physics/3D/shader). */
	motion: (typeof MOTION_LEVELS)[number];
	interaction: string[];
	layout: (typeof LAYOUTS)[number];
	colorMode: (typeof COLOR_MODES)[number];
	density: (typeof DENSITIES)[number];
	tech: string[];
	cost: (typeof COSTS)[number];
	/** Library exports the demo uses (inferred from its imports, never hand-typed). */
	components: string[];
	/** Search synonyms ("disclosure" for an accordion). */
	aliases: string[];
	/** Ids of related demos. */
	related: string[];
	a11y: { reducedMotion: boolean; keyboard: boolean };
	/** ISO date the demo entered the catalog. */
	added: string;
	/** Hand-read facets withheld from search until their audited error rate is at most 5% (see `AUDIT`). */
	review?: Partial<Record<keyof typeof AUDIT.fields, "pending">>;
}

/**
 * Publishing gate. A hand-read facet is exposed in `index.json`, the markdown twins and every filter only when the
 * one-sided 95% UPPER BOUND of its error rate on a seeded, folder-stratified audit is at most `MAX_ERROR_RATE`.
 * The bound, not the point estimate: 0 wrong of 73 reads is not "0% wrong", it is "at most ~4% wrong". A field
 * above the limit stays in the sidecar (validated) as `pending` and is hidden from search until it is corrected and
 * re-audited. A confidently wrong filter is worse than none.
 *
 * Inferred facets (kind, subtype, components, tech, cost, added, a11y.reducedMotion) are derived from the code and
 * are always published. Re-audit a pending field with a new seed, update `AUDIT`, and flip it to `published`.
 *
 * What the audit does NOT cover: only the entries in `AUDIT.read` were re-read by a person; every other entry holds
 * the value the first pass and the correction rules gave it, and is unverified beyond those rules.
 */
export const MAX_ERROR_RATE = 0.05;

export type Review = "published" | "pending";

/** One-sided 95% upper confidence bound of a rate with `wrong` errors in `checked` reads (exact binomial, Clopper-Pearson). */
export function errorUpperBound(wrong: number, checked: number): number {
	if (wrong >= checked) return 1;
	const cdf = (p: number) => {
		let term = (1 - p) ** checked;
		let sum = term;
		for (let i = 1; i <= wrong; i++) {
			term *= ((checked - i + 1) / i) * (p / (1 - p));
			sum += term;
		}
		return sum;
	};
	let lo = wrong / checked;
	let hi = 1;
	for (let i = 0; i < 60; i++) {
		const mid = (lo + hi) / 2;
		if (cdf(mid) > 0.05) lo = mid;
		else hi = mid;
	}
	return hi;
}

/** The audited hand-read facets: errors found among the entries of the holdout (`wrong` of `checked`). */
export const AUDIT = {
	seeds: { first: 569, holdout: 1031 },
	/**
	 * Distinct entries a person read: `first` = 66 random + 64 immersive/expressive (their errors were fixed, then rules
	 * were applied to all entries), `holdout` = 73 random entries not in `first`. `catalog` is the total; the rest,
	 * `catalog - read`, were never re-read.
	 */
	read: { first: 130, holdout: 73, total: 203, catalog: 377, unread: 174 },
	fields: {
		industry: { wrong: 5, checked: 73, review: "pending" as Review },
		style: { wrong: 0, checked: 73, review: "published" as Review },
		motion: { wrong: 0, checked: 73, review: "published" as Review },
		interaction: { wrong: 0, checked: 73, review: "published" as Review },
		layout: { wrong: 0, checked: 73, review: "published" as Review },
		colorMode: { wrong: 0, checked: 73, review: "published" as Review },
		density: { wrong: 0, checked: 73, review: "published" as Review },
		aliases: { wrong: 0, checked: 73, review: "published" as Review },
		related: { wrong: 0, checked: 73, review: "published" as Review },
	},
} as const;

/** Hand-read facets withheld from every public output. */
export const PENDING_FACETS: readonly (keyof typeof AUDIT.fields)[] = (
	Object.keys(AUDIT.fields) as (keyof typeof AUDIT.fields)[]
).filter((f) => AUDIT.fields[f].review === "pending");

const FACET_KEYS = [
	"kind",
	"subtype",
	"industry",
	"style",
	"motion",
	"interaction",
	"layout",
	"colorMode",
	"density",
	"tech",
	"cost",
	"components",
	"aliases",
	"related",
	"a11y",
	"added",
	"review",
] as const;

const isStrings = (v: unknown): v is string[] =>
	Array.isArray(v) && v.every((s) => typeof s === "string" && s.trim() !== "");
const oneOf = (v: unknown, list: readonly string[]) => typeof v === "string" && list.includes(v);

/**
 * Problems of one `index` facet block. `known` is the set of real component names (components must be
 * real exports) and `ids` the set of catalog ids (related must point at one); both are skipped when omitted.
 */
export function checkIndexFacets(
	facets: unknown,
	ctx: { known?: ReadonlySet<string>; ids?: ReadonlySet<string>; self?: string } = {}
): string[] {
	if (!facets || typeof facets !== "object" || Array.isArray(facets))
		return ["index: object required"];
	const f = facets as Record<string, unknown>;
	const errors: string[] = Object.keys(f)
		.filter((k) => !(FACET_KEYS as readonly string[]).includes(k))
		.map((k) => `index: unknown key "${k}"`);
	const multi = (key: string, list: readonly string[], min: number) => {
		const v = f[key];
		if (!isStrings(v) || v.length < min)
			errors.push(`index.${key}: at least ${min} of ${list.join(" | ")}`);
		else
			for (const x of v)
				if (!list.includes(x))
					errors.push(`index.${key}: "${x}" is not one of ${list.join(" | ")}`);
		if (isStrings(v) && new Set(v).size !== v.length) errors.push(`index.${key}: duplicate value`);
	};
	if (!oneOf(f.kind, KINDS)) errors.push(`index.kind: ${KINDS.join(" | ")}`);
	else if (!oneOf(f.subtype, SUBTYPES[f.kind as Kind]))
		errors.push(
			`index.subtype: for kind "${f.kind}" one of ${SUBTYPES[f.kind as Kind].join(" | ")}`
		);
	multi("industry", INDUSTRIES, 1);
	multi("style", STYLES_VOCAB, 1);
	if (!oneOf(f.motion, MOTION_LEVELS)) errors.push(`index.motion: ${MOTION_LEVELS.join(" | ")}`);
	multi("interaction", INTERACTIONS, 1);
	if (!oneOf(f.layout, LAYOUTS)) errors.push(`index.layout: ${LAYOUTS.join(" | ")}`);
	if (!oneOf(f.colorMode, COLOR_MODES)) errors.push(`index.colorMode: ${COLOR_MODES.join(" | ")}`);
	if (!oneOf(f.density, DENSITIES)) errors.push(`index.density: ${DENSITIES.join(" | ")}`);
	multi("tech", TECHS, 1);
	if (!oneOf(f.cost, COSTS)) errors.push(`index.cost: ${COSTS.join(" | ")}`);
	if (!isStrings(f.components)) errors.push("index.components: array of component names");
	else if (ctx.known)
		for (const c of f.components)
			if (!ctx.known.has(c)) errors.push(`index.components: "${c}" is not a library component`);
	if (!isStrings(f.aliases) || f.aliases.some((a) => a !== a.toLowerCase()))
		errors.push("index.aliases: array of lowercase strings");
	if (!isStrings(f.related)) errors.push("index.related: array of catalog ids");
	else if (ctx.ids)
		for (const r of f.related) {
			if (!ctx.ids.has(r)) errors.push(`index.related: "${r}" is not a catalog id`);
			if (r === ctx.self) errors.push("index.related: a demo cannot relate to itself");
		}
	const a = f.a11y as Record<string, unknown> | undefined;
	if (
		!a ||
		typeof a !== "object" ||
		typeof a.reducedMotion !== "boolean" ||
		typeof a.keyboard !== "boolean"
	)
		errors.push("index.a11y: { reducedMotion: boolean, keyboard: boolean }");
	if (
		typeof f.added !== "string" ||
		!/^\d{4}-\d{2}-\d{2}$/.test(f.added) ||
		Number.isNaN(Date.parse(f.added))
	)
		errors.push("index.added: ISO date YYYY-MM-DD");
	// The pending marker is the audit ledger written into the sidecar, never hand-edited.
	const marked = Object.keys((f.review as object | undefined) ?? {})
		.sort()
		.join();
	if (marked !== [...PENDING_FACETS].sort().join())
		errors.push(
			`index.review: must mark exactly the pending facets (${PENDING_FACETS.join(", ") || "none"})`
		);
	else if (f.review && Object.values(f.review as object).some((v) => v !== "pending"))
		errors.push('index.review: values are "pending"');
	// Consistency a reader would otherwise trip over.
	if (f.motion === "none" && f.cost === "gpu")
		errors.push('index: motion "none" cannot cost "gpu"');
	if (isStrings(f.tech) && f.tech.includes("webgl") && f.cost !== "gpu")
		errors.push('index: tech "webgl" costs "gpu"');
	return errors;
}

/**
 * Reserved id ranges per kind. Ids stay append-only and 3 digits widen to 4 only for new kinds; an
 * existing id keeps its value and its range is the one of its group below.
 *
 * Legacy (3 digits): every component demo keeps the id it has, `001-299` and `900-999` (components);
 * `300-399` is motion (text 300-319, scroll 320-339, micro 340-359, transitions 360-379, hero/ambient 380-399).
 * New (4 digits): see `ID_RANGES`.
 */
export interface IdRange {
	kind: Kind;
	/** Subtype this block is for, or `*` for the whole kind. */
	subtype: string;
	from: number;
	to: number;
}

export const ID_RANGES: readonly IdRange[] = [
	{ kind: "component", subtype: "*", from: 1, to: 299 },
	{ kind: "motion", subtype: "text", from: 300, to: 319 },
	{ kind: "motion", subtype: "scroll", from: 320, to: 339 },
	{ kind: "motion", subtype: "micro", from: 340, to: 359 },
	{ kind: "motion", subtype: "transition", from: 360, to: 379 },
	{ kind: "motion", subtype: "ambient", from: 380, to: 399 },
	{ kind: "component", subtype: "*", from: 400, to: 999 },
	// Sections: blocks of 100 per subtype.
	{ kind: "section", subtype: "hero", from: 1000, to: 1099 },
	{ kind: "section", subtype: "feature", from: 1100, to: 1199 },
	{ kind: "section", subtype: "pricing", from: 1200, to: 1299 },
	{ kind: "section", subtype: "cta", from: 1300, to: 1399 },
	{ kind: "section", subtype: "testimonial", from: 1400, to: 1499 },
	{ kind: "section", subtype: "footer", from: 1500, to: 1599 },
	{ kind: "section", subtype: "faq", from: 1600, to: 1699 },
	{ kind: "section", subtype: "navbar", from: 1700, to: 1799 },
	{ kind: "section", subtype: "logos", from: 1800, to: 1899 },
	{ kind: "section", subtype: "*", from: 1900, to: 2999 },
	{ kind: "background", subtype: "*", from: 3000, to: 3199 },
	{ kind: "technique", subtype: "*", from: 3200, to: 3399 },
	{ kind: "3d", subtype: "*", from: 3400, to: 3499 },
	{ kind: "shader", subtype: "*", from: 3500, to: 3599 },
	{ kind: "page", subtype: "*", from: 4000, to: 4499 },
	{ kind: "template", subtype: "*", from: 4500, to: 4999 },
];

/** Ids are 3 digits up to 999 and 4 digits from 1000; `"001"` and `"1000"` are both valid, `"01"` and `"10000"` are not. */
export const ID_PATTERN = /^(\d{3}|[1-9]\d{3})$/;

/** The reserved block an id falls in, or undefined for an id outside every range. */
export function rangeOf(id: string): IdRange | undefined {
	const n = Number(id);
	return (
		ID_RANGES.find((r) => n >= r.from && n <= r.to && r.subtype !== "*") ??
		ID_RANGES.find((r) => n >= r.from && n <= r.to)
	);
}

/**
 * Ids assigned before the ranges existed that sit outside the block of their kind. They keep their value
 * (ids are never renumbered) and are the only exemptions: a new id must live in its kind's range.
 */
export const LEGACY_OUT_OF_RANGE: Readonly<Record<string, Kind>> = {
	"256": "motion", // motion/basics/FadeRise
	"387": "component", // inputs/checkbox/RangeSelect
	"388": "component", // inputs/file-upload/ExternalTrigger
	"389": "component", // inputs/text-field/HiddenLabel
};

/** Whether an id may carry these facets: its range must match the kind, and the subtype when the block names one. */
export function checkIdRange(id: string, kind: string, subtype: string): string | undefined {
	if (LEGACY_OUT_OF_RANGE[id])
		return LEGACY_OUT_OF_RANGE[id] === kind
			? undefined
			: `legacy id ${id} is a "${LEGACY_OUT_OF_RANGE[id]}"`;
	const r = rangeOf(id);
	if (!r) return `id ${id} is outside every reserved range`;
	if (r.kind !== kind) return `id ${id} is reserved for kind "${r.kind}", not "${kind}"`;
	if (r.subtype !== "*" && r.subtype !== subtype)
		return `id ${id} is reserved for subtype "${r.subtype}", not "${subtype}"`;
	return undefined;
}
