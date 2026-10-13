import { loadDocs } from "~/lib/docs";
import { docHref, GROUPS } from "~/lib/nav";
import { mdxToMarkdown } from "../../../packages/ui/scripts/mdx-to-markdown";

const SITE = "https://ui.codeatlas.com.br";

export async function GET() {
	const { entries, flat } = await loadDocs();
	const byId = new Map(entries.map((e) => [e.id, e]));
	const parts = [
		"# CodeAtlas UI: full documentation",
		"",
		`> Open-source Svelte 5 component library (\`@codeatlasdev/ui\`). Index: ${SITE}/llms.txt`,
		"",
	];
	for (const group of GROUPS) {
		for (const d of flat.filter((x) => x.group === group)) {
			const entry = byId.get(d.slug);
			if (!entry) continue;
			parts.push(
				"---",
				"",
				`# ${d.title}`,
				"",
				`Group: ${group}. URL: ${SITE}${docHref(d.slug)}`,
				"",
				d.description,
				"",
				mdxToMarkdown(entry.body ?? ""),
				""
			);
		}
	}
	return new Response(parts.join("\n"), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
