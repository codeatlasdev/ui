// The design-style pages as plain markdown for agents: one file per style (`/llms/styles/<id>.txt`), a digest of all
// of them (`/llms/styles.txt`) and the file the MCP `get_style` tool serves offline (`dist/styles.json`). Pure functions
// over the same data the pages render, so the site endpoints, the MCP build and the tests share one text.

import { STRENGTH_LABEL } from "../../../site/src/data/evidence/references.ts";
import {
	recipeKnobs,
	recipeSource,
	STYLE_LIST,
	type StyleDoc,
	stylePrompt,
	styleReferences,
	TRAIT_AXES,
} from "../../../site/src/data/styles/styles.ts";
import { SITE } from "../src/cli/agent-guide.ts";

/** Path of the digest of every style. */
export const STYLES_INDEX_PATH = "/llms/styles.txt";

/** Path of a style's markdown twin. */
export const stylePath = (id: string) => `/llms/styles/${id}.txt`;

const AXIS_LABEL = {
	type: "Type",
	colour: "Colour",
	shape: "Shape",
	depth: "Depth",
	motion: "Motion",
} as const;

/** One style: everything the page shows, with each claim next to its source, strength and scope. */
export function buildStyleMarkdown(s: StyleDoc): string {
	return [
		`# ${s.name}`,
		"",
		`${s.tagline} Page: ${SITE}/styles/${s.id}/. Index: ${SITE}${STYLES_INDEX_PATH}. Recipe: \`designStyle("${s.id}")\`. Atlas terms: ${s.atlas.join(", ")}.`,
		"",
		"## Where it comes from",
		"",
		...s.origin.flatMap((p) => [p, ""]),
		"Our own account, as background. It is not a claim about users.",
		"",
		"## Traits",
		"",
		...TRAIT_AXES.map(
			(a) =>
				`- ${AXIS_LABEL[a]}: ${s.traits[a].summary} Tokens: ${s.traits[a].tokens.map((t) => `\`${t}\``).join(", ")}.`
		),
		"",
		"## Do",
		"",
		...s.dos.map((d) => `- ${d}`),
		"",
		"## Do not",
		"",
		...s.donts.map((d) => `- ${d}`),
		"",
		"## Accessibility pitfalls",
		"",
		...s.pitfalls.flatMap((p) => [
			`### ${p.title}`,
			"",
			`${STRENGTH_LABEL[p.claim.strength]}${p.claim.refs.length ? ` (${p.claim.refs.join(", ")})` : ""}: ${p.claim.text}`,
			...(p.claim.scope ? ["", `Scope: ${p.claim.scope}`] : []),
			"",
			`What to do: ${p.fix}`,
			"",
		]),
		"## Where it fits",
		"",
		`${s.fitsWhen} (our judgement, not a measured result)`,
		"",
		`Avoid it when: ${s.avoidWhen}`,
		"",
		"Components that suit it:",
		...s.fits.map((f) => `- ${f.component} (${SITE}${f.href}): ${f.why}`),
		"",
		"## The ThemeOptions recipe",
		"",
		"```ts",
		recipeSource(s.id).trimEnd(),
		"```",
		"",
		"Every knob the recipe sets:",
		"",
		"```json",
		recipeKnobs(s.id),
		"```",
		"",
		"## Prompt for your AI",
		"",
		"```text",
		stylePrompt(s.id),
		"```",
		"",
		"## Limits",
		"",
		...s.limits.map((l) => `- ${l}`),
		"",
		`Last reviewed ${s.reviewed}.`,
		"",
		"## References",
		"",
		...styleReferences(s).map(
			(r) =>
				`- [${r.id}] ${r.authors} (${r.year}). ${r.title}. ${r.url} (${STRENGTH_LABEL[r.strength]}). Supports: ${r.supports} Does not support: ${r.doesNotSupport}`
		),
		"",
		`How we use evidence: ${SITE}/llms/concepts/evidence.txt`,
		"",
	].join("\n");
}

/** The digest: every style with its tagline, where it fits and where not, linking its own file. */
export function buildStylesIndex(styles: readonly StyleDoc[] = STYLE_LIST): string {
	return [
		"# Design styles",
		"",
		`> ${styles.length} design-style recipes of @codeatlasdev/ui, each a live page rendered in its own style. A recipe is one call: \`designStyle("<id>")\`. Page: ${SITE}/styles/. Index: ${SITE}/llms.txt`,
		"",
		"How to read it: a recipe is a proposal built from the library's design knobs, not a measurement of any named visual language. Accessibility claims name their source and strength; none says a style performs better. Method: " +
			`${SITE}/llms/concepts/evidence.txt`,
		"",
		...styles.flatMap((s) => [
			`## ${s.name}`,
			"",
			`${s.tagline}`,
			"",
			`- Recipe: \`designStyle("${s.id}")\`. File: ${SITE}${stylePath(s.id)}. Page: ${SITE}/styles/${s.id}/.`,
			`- Fits: ${s.fitsWhen}`,
			`- Avoid when: ${s.avoidWhen}`,
			`- Accessibility to check: ${s.pitfalls.map((p) => p.title).join("; ")}.`,
			"",
		]),
	].join("\n");
}

/** What `dist/styles.json` holds: enough for `get_style` to answer with no network. */
export interface StyleFile {
	index: string;
	styles: Record<string, string>;
	/** Display names by id, so `get_style` also resolves "Swiss" or "neobrutalism". */
	names: Record<string, string>;
}

export function buildStyleFile(styles: readonly StyleDoc[] = STYLE_LIST): StyleFile {
	return {
		index: buildStylesIndex(styles),
		styles: Object.fromEntries(styles.map((s) => [s.id, buildStyleMarkdown(s)])),
		names: Object.fromEntries(styles.map((s) => [s.id, s.name])),
	};
}
