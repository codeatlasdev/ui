// The references dataset behind every Evidence block, concept page and atlas term. Plain data and pure
// functions only: the Astro site, the markdown twins (packages/ui/scripts/mdx-to-markdown.ts), the MCP build
// and the tests all import this file, so a source has one definition. Rules for using it:
// site/src/content/docs/concepts/evidence.mdx.
import data from "./references.json";

/**
 * How strongly a claim is backed. A label belongs to a claim, never to a whole page.
 *  - established: replicated findings or a meta-analysis / authoritative review of them
 *  - supported: one or more peer-reviewed studies
 *  - preliminary: a single or small study, a preprint, or a vendor's own report
 *  - practice: a standard or a published guideline (WCAG, a spec, a platform guide, a practitioner article):
 *    it says what is required or recommended, not what users prefer
 *  - heuristic: our own judgement, with no source
 */
export const STRENGTHS = [
	"established",
	"supported",
	"preliminary",
	"practice",
	"heuristic",
] as const;
export type Strength = (typeof STRENGTHS)[number];

export const STRENGTH_LABEL: Record<Strength, string> = {
	established: "Established",
	supported: "Supported",
	preliminary: "Preliminary",
	practice: "Standard or guideline",
	heuristic: "Our judgement",
};

export const STRENGTH_MEANING: Record<Strength, string> = {
	established: "Replicated findings, or a meta-analysis or authoritative review of them.",
	supported: "One or more peer-reviewed studies. Read the scope before generalizing.",
	preliminary: "A single or small study, a preprint, or a vendor reporting its own research.",
	practice:
		"A standard or guideline. It says what is required or recommended, not what users prefer.",
	heuristic: "Our own judgement. No source backs it, so test it with your users.",
};

export const REFERENCE_KINDS = [
	"peer-reviewed",
	"review",
	"preprint",
	"standard",
	"guideline",
	"applied-research",
	"vendor-research",
] as const;
export type ReferenceKind = (typeof REFERENCE_KINDS)[number];

/** `claim-read`: the wording the page relies on was read at the source. `identity-only`: only the record exists. */
export type VerificationLevel = "claim-read" | "identity-only";

export interface Reference {
	/** `E01` owner list, `N` NN/g, `W` WCAG, `M` MDN, `D` web.dev. Stable: pages and atlas terms link to it. */
	id: string;
	authors: string;
	year: number;
	title: string;
	venue: string;
	kind: ReferenceKind;
	url: string;
	topic: string;
	/** What the source supports, with who or what was studied. */
	supports: string;
	/** What it does not support: the limit of the scope. */
	doesNotSupport: string;
	strength: Strength;
	verified: { date: string; level: VerificationLevel; how: string; excerpt: string };
}

export const REFERENCES: readonly Reference[] = data.references as Reference[];
const BY_ID = new Map(REFERENCES.map((r) => [r.id, r]));

export const getReference = (id: string): Reference | undefined => BY_ID.get(id);

/** Ids of a comma, semicolon or space separated list (`"E01, E06"`), in order and without duplicates. */
export function parseRefIds(list: string): string[] {
	return [...new Set(list.split(/[\s,;]+/).filter(Boolean))];
}

/** Error messages for every problem in a dataset; empty means valid. Used by the unit test and the build. */
export function checkReferences(refs: readonly Reference[]): string[] {
	const errors: string[] = [];
	const seen = new Set<string>();
	const isoDate = /^\d{4}-\d{2}-\d{2}$/;
	for (const r of refs) {
		const at = `reference ${r.id}`;
		if (!/^[A-Z]\d{2}$/.test(r.id)) errors.push(`${at}: id must be a letter and two digits`);
		if (seen.has(r.id)) errors.push(`${at}: duplicate id`);
		seen.add(r.id);
		for (const f of ["authors", "title", "venue", "topic", "supports", "doesNotSupport"] as const)
			if (!r[f]?.trim()) errors.push(`${at}: ${f} is empty`);
		if (!Number.isInteger(r.year) || r.year < 1900 || r.year > 2100) errors.push(`${at}: bad year`);
		if (!REFERENCE_KINDS.includes(r.kind)) errors.push(`${at}: unknown kind "${r.kind}"`);
		if (!STRENGTHS.includes(r.strength) || r.strength === "heuristic")
			errors.push(`${at}: strength must be one of established, supported, preliminary, practice`);
		if (!/^https:\/\//.test(r.url)) errors.push(`${at}: url must be https`);
		if (!r.verified || !isoDate.test(r.verified.date))
			errors.push(`${at}: verified.date is not YYYY-MM-DD`);
		else {
			if (!r.verified.excerpt?.trim()) errors.push(`${at}: verified.excerpt is empty`);
			if (!r.verified.how?.trim()) errors.push(`${at}: verified.how is empty`);
			if (r.verified.level !== "claim-read" && r.verified.level !== "identity-only")
				errors.push(`${at}: verified.level must be claim-read or identity-only`);
		}
		// A standard or guideline is never evidence of what users prefer, and a vendor's own study is never
		// better than preliminary: the kind caps the strength.
		if ((r.kind === "standard" || r.kind === "guideline") && r.strength !== "practice")
			errors.push(`${at}: a ${r.kind} is "practice", not "${r.strength}"`);
		if (r.kind === "vendor-research" && r.strength !== "preliminary")
			errors.push(`${at}: vendor research is "preliminary"`);
		if (r.kind === "preprint" && r.strength !== "preliminary")
			errors.push(`${at}: a preprint is "preliminary"`);
	}
	return errors;
}

/**
 * Words that present opinion or a single study as proof, or brand the site as science. Matched
 * case-insensitively in site content by tests/evidence-rules.test.ts.
 */
export const BANNED_PHRASES: readonly string[] = [
	"scientifically proven",
	"science says",
	"science-based",
	"science-backed",
	"studies show",
	"studies prove",
	"research proves",
	"research shows that",
	"research says",
	"proven to",
	"backed by science",
];
