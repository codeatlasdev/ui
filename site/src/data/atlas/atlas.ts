// The design atlas: 269 terms for aesthetics, layouts, interaction patterns and design-system languages.
// Plain data and pure functions, shared by the Astro pages, the per-term markdown twins, the MCP build and the
// tests. How to read it (heuristic scores, hypothesis audiences, what the references do and do not support):
// site/src/content/docs/concepts/evidence.mdx.
import { DESIGN_STYLES } from "../../../../packages/ui/src/lib/theme/styles.ts";
import { getReference, type Reference } from "../evidence/references.ts";
import data from "./terms.json";

export const CATEGORIES = [
	"Aesthetic",
	"Layout",
	"Future / AI",
	"Interaction pattern",
	"Movement",
	"Interaction principle",
	"Design system",
	"Typography and composition",
	"Visual principle",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Where a term is in 2026. A normalised facet; the owner's 20 free-text statuses map onto these eight. */
export const STATUSES = [
	"established",
	"active",
	"emerging",
	"niche",
	"experimental",
	"conceptual",
	"historical",
	"descriptive",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
	established: "Established",
	active: "Active",
	emerging: "Emerging",
	niche: "Niche",
	experimental: "Experimental",
	conceptual: "Conceptual",
	historical: "Historical",
	descriptive: "Descriptive label",
};

export const STATUS_MEANING: Record<Status, string> = {
	established: "Documented and in wide use.",
	active: "In current use.",
	emerging: "Appearing in practice, not yet settled.",
	niche: "Used in a narrow community or product type.",
	experimental: "Tried in experiments or prototypes.",
	conceptual: "An idea or proposal more than a practice.",
	historical: "A historical movement that still informs current work.",
	descriptive: "An informal label for a look, not a defined system.",
};

/** Editorial projection, not a forecast. */
export const TRENDS = [
	"rising",
	"rising-in-context",
	"potential",
	"steady",
	"niche",
	"uncertain",
	"declining",
] as const;
export type Trend = (typeof TRENDS)[number];

export const TREND_LABEL: Record<Trend, string> = {
	rising: "Rising",
	"rising-in-context": "Rising in some contexts",
	potential: "Potential",
	steady: "Steady",
	niche: "Niche",
	uncertain: "Uncertain",
	declining: "Declining",
};

export const STANDARDIZATIONS = ["technical", "informal", "historical", "product"] as const;
export type Standardization = (typeof STANDARDIZATIONS)[number];

export const STANDARDIZATION_LABEL: Record<Standardization, string> = {
	technical: "Known technical term or standard",
	informal: "Community or market label, or a descriptive term",
	historical: "Established historical name",
	product: "Name of a product's design system or language",
};

/** `indirect`: the sources support underlying principles, not this style. `emerging`: exploratory, no causal validation. */
export const EVIDENCE_KINDS = ["indirect", "emerging"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
	indirect: "Indirect: the sources support underlying principles, not a preference for this style",
	emerging: "Emerging: exploratory work, with no causal validation for this style",
};

export interface Scores {
	/** Relative editorial judgement from 1 to 5. Never a result of a study. */
	complexity: number;
	expressiveness: number;
	density: number;
}

export interface Term {
	/** `DS001` to `DS269`. Stable: designStyle recipes and pages link to it. */
	id: string;
	term: string;
	category: Category;
	subcategory: string;
	definition: string;
	traits: string[];
	/** A hypothesis about motivation, task and context. Never measured, never a statement about a group. */
	audience: string;
	sectors: string[];
	risk: string;
	mitigation: string;
	scores: Scores;
	/** Reference ids (E01...): they support underlying principles, not the style itself. */
	refs: string[];
	evidence: EvidenceKind;
	standardization: Standardization;
	status: Status;
	trend: Trend;
}

export const TERMS: readonly Term[] = data.terms as Term[];
const BY_ID = new Map(TERMS.map((t) => [t.id, t]));
export const getTerm = (id: string): Term | undefined => BY_ID.get(id);

export const SCORE_NAMES = ["complexity", "expressiveness", "density"] as const;
export type ScoreName = (typeof SCORE_NAMES)[number];

export const SCORE_LABEL: Record<ScoreName, string> = {
	complexity: "Visual complexity",
	expressiveness: "Expressiveness",
	density: "Information density",
};

/** One scale, three words: what 1, 3 and 5 mean for each score. */
export const SCORE_ENDS: Record<ScoreName, [string, string]> = {
	complexity: ["few visual elements", "many layered elements"],
	expressiveness: ["restrained, neutral", "highly expressive"],
	density: ["sparse", "dense"],
};

/** Date the atlas dataset and its caveats were last reviewed (YYYY-MM-DD). Shown in the Limits box of every atlas page. */
export const ATLAS_REVIEWED = "2026-10-25";

/** What the atlas does not know. One list, rendered on the browse page, every term page and in the markdown twins. */
export const ATLAS_LIMITS: readonly string[] = [
	"The atlas is a broad, living catalogue, not every style that exists. No authority enumerates them, and the classes (movement, aesthetic, design system, layout, pattern, principle) overlap.",
	"The 1 to 5 scores are relative editorial judgements. They are not results of a study and not a measure of quality.",
	"An audience is a hypothesis about motivation, task and context. It was never measured and says nothing about any age, gender or other group.",
	"The sources support underlying principles (visual complexity, legibility, grouping, accessibility, platform conventions). None shows that a particular style works better or is preferred.",
	"The 2027 to 2030 trend is an editorial projection, not a forecast.",
	"Terms in the Future / AI category rest on exploratory work, some of it preprints, with no causal validation.",
];

export const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

/** The path segment of a term's page: `swiss-style`. Unique across the atlas (checked by `checkAtlas`). */
export const termSlug = (t: Pick<Term, "term">) => slugify(t.term);
export const termHref = (t: Pick<Term, "term">) => `/atlas/${termSlug(t)}/`;

/** Terms by slug, for the static routes. */
export const TERMS_BY_SLUG = new Map(TERMS.map((t) => [termSlug(t), t]));

/** The sources behind a term, as full records. Throws on an unknown id: the dataset test guarantees none. */
export function termReferences(t: Term): Reference[] {
	return t.refs.map((id) => {
		const r = getReference(id);
		if (!r) throw new Error(`${t.id}: unknown reference ${id}`);
		return r;
	});
}

// ── Our design styles, as live examples ───────────────────────────────────────

/** Pages that exist for a design style. A style gets a link only when its page is listed here. */
export const STYLE_PAGES: ReadonlySet<string> = new Set<string>();

/** `/styles/<id>/` for a design style that has a page; `null` otherwise, so a term never links to a 404. */
export const styleHref = (styleId: string): string | null =>
	STYLE_PAGES.has(styleId) ? `/styles/${styleId}/` : null;

export interface StyleExample {
	id: string;
	label: string;
	description: string;
	/** `null` until the style has its own page. */
	href: string | null;
}

/** The design-style recipes of the library that implement a term (from `DESIGN_STYLES[].taxonomy`). */
export function stylesFor(termId: string): StyleExample[] {
	return Object.values(DESIGN_STYLES)
		.filter((s) => s.taxonomy.includes(termId))
		.map((s) => ({ id: s.id, label: s.label, description: s.description, href: styleHref(s.id) }));
}

// ── Facets ────────────────────────────────────────────────────────────────────

export interface Filters {
	query?: string;
	category?: Category;
	status?: Status;
	trend?: Trend;
	standardization?: Standardization;
	/** 1 to 5, inclusive range per score. */
	complexity?: [number, number];
	expressiveness?: [number, number];
	density?: [number, number];
}

const inRange = (v: number, r?: [number, number]) => !r || (v >= r[0] && v <= r[1]);

/** Terms matching every set filter. The search looks at the term, subcategory, definition, traits and sectors. */
export function filterTerms(terms: readonly Term[], f: Filters): Term[] {
	const q = f.query?.trim().toLowerCase();
	return terms.filter(
		(t) =>
			(!f.category || t.category === f.category) &&
			(!f.status || t.status === f.status) &&
			(!f.trend || t.trend === f.trend) &&
			(!f.standardization || t.standardization === f.standardization) &&
			inRange(t.scores.complexity, f.complexity) &&
			inRange(t.scores.expressiveness, f.expressiveness) &&
			inRange(t.scores.density, f.density) &&
			(!q ||
				[t.term, t.subcategory, t.definition, ...t.traits, ...t.sectors]
					.join(" ")
					.toLowerCase()
					.includes(q))
	);
}

/** Count of terms per value of a facet, for the filter UI (counts ignore that facet's own filter). */
export function facetCounts<K extends "category" | "status" | "trend" | "standardization">(
	terms: readonly Term[],
	key: K
): Map<Term[K], number> {
	const out = new Map<Term[K], number>();
	for (const t of terms) out.set(t[key], (out.get(t[key]) ?? 0) + 1);
	return out;
}

// ── Prose derived from the data ───────────────────────────────────────────────

/**
 * Where to start and what to check: composed from the term's own fields, never from an invented claim. The
 * dataset has no per-term "when not to use" beyond the risk, so that is what the page shows, with the standard
 * advice to validate.
 */
export function guidance(t: Term): { whenToUse: string; whenNot: string; validate: string } {
	return {
		whenToUse: `Consider it when the task and motivation match: ${t.audience.charAt(0).toLowerCase()}${t.audience.slice(1)}. Typical settings: ${t.sectors.join(", ").toLowerCase()}.`,
		whenNot: `Be careful when the risk below would hurt the main task: ${t.risk.charAt(0).toLowerCase()}${t.risk.slice(1)}.`,
		validate:
			t.evidence === "emerging"
				? "Test with realistic scenarios: task success, accuracy, reversal, auditability, understanding of what the system does on its own, and a human's ability to step in."
				: "Test a prototype against a plain baseline on a real task: completion, time, errors, comprehension, accessibility and preference, segmented by context rather than by stereotype.",
	};
}

/** A paste-in prompt that carries the term's trade-offs into a coding agent. Uses our recipe when one exists. */
export function termPrompt(t: Term): string {
	const styles = stylesFor(t.id);
	const lines = [
		`Design this interface in the "${t.term}" direction (${t.category.toLowerCase()}, ${t.subcategory.toLowerCase()}): ${t.definition.replace(/\.$/, "")}.`,
		`Visual and interaction traits to use: ${t.traits.join(", ")}.`,
		`Main UX risk: ${t.risk.replace(/\.$/, "")}. Mitigate it: ${t.mitigation.replace(/\.$/, "")}.`,
		"Keep it accessible to WCAG 2.2 AA: contrast, visible focus, keyboard operation, 24 px minimum targets, reflow at 320 CSS px and reduced motion.",
		"Keep the content, hierarchy and behavior the same as a plain baseline so the two can be compared. Do not claim the style performs better; the choice should be validated with users.",
	];
	if (styles.length)
		lines.push(
			`In @codeatlasdev/ui start from the design-style recipe${styles.length > 1 ? "s" : ""} ${styles.map((s) => `\`designStyle("${s.id}")\``).join(", ")} and override only tokens (\`--ca-*\`).`
		);
	return lines.join("\n");
}

// ── Validation ────────────────────────────────────────────────────────────────

/** Error messages for every problem in a dataset; empty means valid. Used by the unit test and the build. */
export function checkAtlas(terms: readonly Term[]): string[] {
	const errors: string[] = [];
	const ids = new Set<string>();
	const slugs = new Map<string, string>();
	for (const t of terms) {
		const at = `term ${t.id}`;
		if (!/^DS\d{3}$/.test(t.id)) errors.push(`${at}: id must be DS and three digits`);
		if (ids.has(t.id)) errors.push(`${at}: duplicate id`);
		ids.add(t.id);
		const slug = termSlug(t);
		if (!slug) errors.push(`${at}: term has no slug`);
		else if (slugs.has(slug)) errors.push(`${at}: slug "${slug}" also used by ${slugs.get(slug)}`);
		slugs.set(slug, t.id);
		for (const f of [
			"term",
			"subcategory",
			"definition",
			"audience",
			"risk",
			"mitigation",
		] as const)
			if (!t[f]?.trim()) errors.push(`${at}: ${f} is empty`);
		if (!CATEGORIES.includes(t.category)) errors.push(`${at}: unknown category "${t.category}"`);
		if (!STATUSES.includes(t.status)) errors.push(`${at}: unknown status "${t.status}"`);
		if (!TRENDS.includes(t.trend)) errors.push(`${at}: unknown trend "${t.trend}"`);
		if (!STANDARDIZATIONS.includes(t.standardization))
			errors.push(`${at}: unknown standardization "${t.standardization}"`);
		if (!EVIDENCE_KINDS.includes(t.evidence))
			errors.push(`${at}: unknown evidence "${t.evidence}"`);
		if (!t.traits?.length || t.traits.some((x) => !x.trim()))
			errors.push(`${at}: traits are empty`);
		if (!t.sectors?.length || t.sectors.some((x) => !x.trim()))
			errors.push(`${at}: sectors are empty`);
		for (const n of SCORE_NAMES) {
			const v = t.scores?.[n];
			if (!Number.isInteger(v) || v < 1 || v > 5)
				errors.push(`${at}: score ${n} must be an integer 1-5`);
		}
		if (!t.refs?.length) errors.push(`${at}: no references`);
		for (const id of t.refs ?? [])
			if (!getReference(id)) errors.push(`${at}: unknown reference ${id}`);
		if (new Set(t.refs).size !== t.refs?.length) errors.push(`${at}: duplicate reference`);
	}
	for (const s of Object.values(DESIGN_STYLES))
		for (const id of s.taxonomy)
			if (!ids.has(id)) errors.push(`designStyle ${s.id}: taxonomy ${id} is not an atlas term`);
	return errors;
}
