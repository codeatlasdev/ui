// The atlas as plain markdown for agents: one file per term (`/llms/atlas/<slug>.txt`), an index of all terms
// (`/llms/atlas.txt`) and the compact line the MCP `search_terms` returns. Pure functions over the dataset, so the
// site endpoints, the MCP build and the tests share one text.

import {
	ATLAS_LIMITS,
	ATLAS_REVIEWED,
	EVIDENCE_LABEL,
	guidance,
	SCORE_LABEL,
	SCORE_NAMES,
	STANDARDIZATION_LABEL,
	STATUS_LABEL,
	STATUS_MEANING,
	stylesFor,
	TERMS,
	type Term,
	TREND_LABEL,
	termPrompt,
	termReferences,
	termSlug,
} from "../../../site/src/data/atlas/atlas.ts";
import {
	REFERENCES,
	type Reference,
	STRENGTH_LABEL,
} from "../../../site/src/data/evidence/references.ts";
import { SITE } from "../src/cli/agent-guide.ts";

/** Path of a term's markdown twin. */
export const atlasTermPath = (t: Pick<Term, "term">) => `/llms/atlas/${termSlug(t)}.txt`;

/** One term: everything the page shows, with the caveats attached to the values they qualify. */
export function buildTermMarkdown(t: Term): string {
	const g = guidance(t);
	const styles = stylesFor(t.id);
	const refs = termReferences(t);
	return [
		`# ${t.term}`,
		"",
		`${t.id}. ${t.category}: ${t.subcategory}. Page: ${SITE}/atlas/${termSlug(t)}/. Index: ${SITE}/llms/atlas.txt`,
		"",
		`${t.definition}.`,
		"",
		`- Status in 2026: ${STATUS_LABEL[t.status]}. ${STATUS_MEANING[t.status]}`,
		`- Trend 2027 to 2030: ${TREND_LABEL[t.trend]} (an editorial projection, not a forecast).`,
		`- The term: ${STANDARDIZATION_LABEL[t.standardization]}.`,
		"",
		"## Traits",
		"",
		...t.traits.map((x) => `- ${x}`),
		"",
		`Typical settings: ${t.sectors.join(", ")}.`,
		"",
		"## When to use it, and when not",
		"",
		g.whenToUse,
		"",
		g.whenNot,
		"",
		`Audience (a hypothesis about motivation and task, never measured, not a statement about any group): ${t.audience}.`,
		"",
		"## UX risk and how to reduce it",
		"",
		`- Risk: ${t.risk}.`,
		`- Mitigation and accessibility: ${t.mitigation}.`,
		`- How to check: ${g.validate}`,
		"",
		"## Evidence",
		"",
		`${EVIDENCE_LABEL[t.evidence]}.`,
		"",
		"The sources support the principles that apply to this term. None shows that this style works better or is preferred.",
		"",
		...refs.map(
			(r) =>
				`- [${r.id}] ${r.authors} (${r.year}). ${r.title}. ${r.url} (${STRENGTH_LABEL[r.strength]}). Does not support: ${r.doesNotSupport}`
		),
		"",
		"## Limits",
		"",
		...ATLAS_LIMITS.map((x) => `- ${x}`),
		"",
		`Last reviewed ${ATLAS_REVIEWED}.`,
		"",
		"## Heuristic scales",
		"",
		"Relative editorial judgements from 1 to 5, not results of a study.",
		"",
		...SCORE_NAMES.map((n) => `- ${SCORE_LABEL[n]}: ${t.scores[n]} / 5 (heuristic)`),
		"",
		"## In our library",
		"",
		...(styles.length
			? styles.map((s) => `- designStyle("${s.id}"): ${s.label}. ${s.description}`)
			: ["No design-style recipe implements this term yet; build it from `--ca-*` tokens."]),
		"",
		"## Prompt for your AI",
		"",
		"```text",
		termPrompt(t),
		"```",
		"",
	].join("\n");
}

/** One line per term: what `search_terms` returns and what the index lists. */
export function termLine(t: Term): string {
	return `${t.id} ${t.term} (${t.category}: ${t.subcategory}; ${STATUS_LABEL[t.status].toLowerCase()}; complexity ${t.scores.complexity}, expressiveness ${t.scores.expressiveness}, density ${t.scores.density}, heuristic): ${t.definition}`;
}

/** The index of the atlas by category, linking each term's own file. */
export function buildAtlasIndexMarkdown(terms: readonly Term[] = TERMS): string {
	const cats = [...new Set(terms.map((t) => t.category))];
	return [
		"# Design atlas",
		"",
		`> ${terms.length} terms for aesthetics, layouts, interaction patterns and design-system languages. A map, not a verdict. Page: ${SITE}/atlas/. Index: ${SITE}/llms.txt`,
		"",
		"How to read it: the 1 to 5 scores are heuristic editorial judgements; an audience is a hypothesis about motivation and task, never measured; the references behind a term support underlying principles, not the style. Validate a choice with your own users.",
		`Method and limits: ${SITE}/llms/concepts/evidence.txt`,
		"",
		"Limits:",
		...ATLAS_LIMITS.map((x) => `- ${x}`),
		`Last reviewed ${ATLAS_REVIEWED}.`,
		"",
		...cats.flatMap((c) => [
			`## ${c}`,
			"",
			...terms
				.filter((t) => t.category === c)
				.map((t) => `- [${t.term}](${SITE}${atlasTermPath(t)}): ${t.definition}`),
			"",
		]),
	].join("\n");
}

/** One reference as markdown: the source, what it supports and does not, and what was read when. */
export function buildReferenceMarkdown(r: Reference): string {
	return [
		`# [${r.id}] ${r.title}`,
		"",
		`${r.authors} (${r.year}). ${r.venue}. ${r.url}`,
		"",
		`- Kind: ${r.kind}. Strength: ${STRENGTH_LABEL[r.strength]}.`,
		`- Topic: ${r.topic}.`,
		`- Supports: ${r.supports}`,
		`- Does not support: ${r.doesNotSupport}`,
		`- Checked ${r.verified.date} (${r.verified.level === "claim-read" ? "wording read at the source" : "record only; text not read, so no claim may rest on it"}): ${r.verified.how}.`,
		`- Excerpt: "${r.verified.excerpt}"`,
		"",
	].join("\n");
}

/** What `dist/atlas.json` holds: enough for the three MCP tools to answer with no network. */
export interface AtlasFile {
	terms: {
		id: string;
		slug: string;
		term: string;
		category: string;
		line: string;
		text: string;
		search: string;
	}[];
	references: { id: string; text: string }[];
}

export function buildAtlasFile(terms: readonly Term[] = TERMS): AtlasFile {
	return {
		terms: terms.map((t) => ({
			id: t.id,
			slug: termSlug(t),
			term: t.term,
			category: t.category,
			line: termLine(t),
			text: buildTermMarkdown(t),
			search: [t.term, t.category, t.subcategory, t.definition, ...t.traits, ...t.sectors]
				.join(" ")
				.toLowerCase(),
		})),
		references: REFERENCES.map((r) => ({ id: r.id, text: buildReferenceMarkdown(r) })),
	};
}
