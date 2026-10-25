// MDX docs body to plain markdown (shared by the site's llms-full.txt and the MCP guide bundle).
import {
	getReference,
	parseRefIds,
	STRENGTH_LABEL,
	type Strength,
} from "../../../site/src/data/evidence/references.ts";

/**
 * Raw `.svelte` demo sources by import name, for the `<Demo src={XSrc}>` examples of one MDX page.
 * Pure: the caller supplies the lookup (`demoSourceLookup` in Node, `import.meta.glob` in Vite).
 */
export function demoSources(
	mdx: string,
	read: (demoPath: string) => string | undefined
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const m of mdx.matchAll(/^import\s+(\w+)\s+from\s+"~\/demos\/([^"]+\.svelte)\?raw"/gm)) {
		const src = read(m[2]);
		if (src !== undefined) out[m[1]] = src;
	}
	return out;
}

/** `<Props rows={[{ name: "x", type: "y", default: "z", description: "..." }]} />` to a markdown table. */
function propsTable(heading: string, block: string): string {
	const field = (row: string, key: string) =>
		row.match(new RegExp(`${key}:\\s*("(?:[^"\\\\]|\\\\.)*")`))?.[1];
	const rows = block.split("\n").filter((l) => /\bname:\s*"/.test(l));
	const cell = (v?: string) => (v ? (JSON.parse(v) as string).replace(/\|/g, "\\|") : "");
	const body = rows.map(
		(r) =>
			`| \`${cell(field(r, "name"))}\` | \`${cell(field(r, "type"))}\` | ${cell(field(r, "default"))} | ${cell(field(r, "description"))} |`
	);
	return [
		"",
		`### ${heading}`,
		"",
		"| Prop | Type | Default | Description |",
		"|---|---|---|---|",
		...body,
		"",
	].join("\n");
}

/** `strength="x"`, `refs="E01"` or `scope="..."` of a JSX opening tag. */
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

/** "Tuch et al. 2012": the short citation shown next to a claim. */
function shortCite(id: string): string {
	const r = getReference(id);
	return r ? `${r.authors.split(",")[0]}${r.authors.includes(",") ? " et al." : ""} ${r.year}` : id;
}

/** The References list of a page as markdown: what each source supports, what it does not, and when it was checked. */
function refsMarkdown(ids: string, title = "References"): string {
	const items = parseRefIds(ids).map((id) => {
		const r = getReference(id);
		if (!r) return `- ${id}: unknown reference`;
		const checked =
			r.verified.level === "identity-only" ? "record only, text not read" : "text read";
		return [
			`- [${r.id}] ${r.authors} (${r.year}). ${r.title}. ${r.venue}. ${r.url}`,
			`  - Strength: ${STRENGTH_LABEL[r.strength]}. Supports: ${r.supports}`,
			`  - Does not support: ${r.doesNotSupport}`,
			`  - Checked ${r.verified.date} (${checked}).`,
		].join("\n");
	});
	return ["", `## ${title}`, "", ...items, ""].join("\n");
}

/** MDX body to plain markdown: drop imports and JSX, keep prose and code fences untouched. */
export function mdxToMarkdown(mdx: string, sources: Record<string, string> = {}): string {
	const out: string[] = [];
	let inFence = false;
	let fenceIndent = 0;
	let skipping = false; // inside a multi-line JSX tag such as <Props rows={[ ... ]} />
	let propsHeading = "";
	let propsLines: string[] | null = null;
	let claimClose = ""; // the scope line to emit at the </Claim> that closes the open claim
	let inClaim = false;
	let limitsReviewed = "";
	for (const raw of mdx.split("\n")) {
		const fence = raw.match(/^(\s*)```/);
		if (fence) {
			inFence = !inFence;
			if (inFence) fenceIndent = fence[1].length;
			out.push(raw.slice(Math.min(fenceIndent, fence[1].length)));
			continue;
		}
		if (inFence) {
			out.push(raw.startsWith(" ".repeat(fenceIndent)) ? raw.slice(fenceIndent) : raw);
			continue;
		}
		if (propsLines) {
			propsLines.push(raw);
			if (raw.trim().endsWith("/>")) {
				out.push(propsTable(propsHeading, propsLines.join("\n")));
				propsLines = null;
			}
			continue;
		}
		if (skipping) {
			if (raw.trim().endsWith(">")) skipping = false;
			continue;
		}
		const line = raw.trim();
		if (/^import\s/.test(line)) continue;
		const demo = line.match(/^<Demo\s+title="([^"]+)"(?:\s+description="([^"]*)")?/);
		if (demo) {
			const src = sources[line.match(/\bsrc=\{(\w+)\}/)?.[1] ?? ""];
			out.push(
				`### ${demo[1]}`,
				"",
				...(demo[2] ? [demo[2], ""] : []),
				...(src ? ["```svelte", src.trimEnd(), "```", ""] : [])
			);
			continue;
		}
		const props = line.match(/^<Props\b(?:\s+title="([^"]+)")?/);
		if (props) {
			propsHeading = props[1] ?? "Props";
			propsLines = [raw];
			if (line.endsWith("/>")) {
				out.push(propsTable(propsHeading, raw));
				propsLines = null;
			}
			continue;
		}
		const claim = line.match(/^<Claim\b[^>]*>/);
		if (claim) {
			const strength = attr(claim[0], "strength") as Strength | undefined;
			const refs = parseRefIds(attr(claim[0], "refs") ?? "");
			const scope = attr(claim[0], "scope");
			const label = strength ? STRENGTH_LABEL[strength] : "Claim";
			out.push(
				`> **${label}**${refs.length ? `: ${refs.map(shortCite).join("; ")} [${refs.join(", ")}]` : ""}`
			);
			claimClose = scope ? `> *Scope: ${scope}*` : "";
			// Body lines of the claim are quoted until the closing tag.
			out.push(">");
			inClaim = true;
			continue;
		}
		if (line === "</Claim>") {
			if (claimClose) out.push(">", claimClose);
			claimClose = "";
			inClaim = false;
			continue;
		}
		const refsTag = line.match(/^<Refs\b[^>]*\/>/);
		if (refsTag) {
			out.push(refsMarkdown(attr(refsTag[0], "ids") ?? "", attr(refsTag[0], "title")));
			continue;
		}
		const limits = line.match(/^<Limits\b[^>]*>/);
		if (limits) {
			out.push("", "## Limits", "");
			limitsReviewed = attr(limits[0], "reviewed") ?? "";
			continue;
		}
		if (line === "</Limits>") {
			if (limitsReviewed) out.push("", `Last reviewed ${limitsReviewed}.`);
			limitsReviewed = "";
			continue;
		}
		// Any other JSX tag (<Steps>, </Callout>, <LinkCard ... />, <CodeGroup .../>) is layout only.
		// A tag that does not end on its own line (multi-line props) is skipped until its closing `>`.
		if (/^<\/?[A-Z]/.test(line)) {
			if (!line.endsWith(">")) skipping = true;
			continue;
		}
		const text = raw.replace(/^ {2}(?=\S)/, "");
		out.push(inClaim ? (text ? `> ${text}` : ">") : text);
	}
	return out
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}
