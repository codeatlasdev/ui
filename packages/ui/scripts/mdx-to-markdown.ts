// MDX docs body to plain markdown (shared by the site's llms-full.txt and the MCP guide bundle).
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

/** MDX body to plain markdown: drop imports and JSX, keep prose and code fences untouched. */
export function mdxToMarkdown(mdx: string): string {
	const out: string[] = [];
	let inFence = false;
	let fenceIndent = 0;
	let skipping = false; // inside a multi-line JSX tag such as <Props rows={[ ... ]} />
	let propsHeading = "";
	let propsLines: string[] | null = null;
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
			out.push(`### ${demo[1]}`, "", ...(demo[2] ? [demo[2], ""] : []));
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
		// Any other JSX tag (<Steps>, </Callout>, <LinkCard ... />, <CodeGroup .../>) is layout only.
		// A tag that does not end on its own line (multi-line props) is skipped until its closing `>`.
		if (/^<\/?[A-Z]/.test(line)) {
			if (!line.endsWith(">")) skipping = true;
			continue;
		}
		out.push(raw.replace(/^ {2}(?=\S)/, ""));
	}
	return out
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}
