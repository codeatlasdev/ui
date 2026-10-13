import { llmsTxt } from "@codeatlasdev/ui/seo";
import { loadDocs } from "~/lib/docs";
import { docHref, GROUPS } from "~/lib/nav";

const SITE = "https://ui.codeatlas.com.br";

export async function GET() {
	const { flat } = await loadDocs();
	const body = llmsTxt({
		title: "CodeAtlas UI",
		summary:
			"Open-source Svelte 5 component library (`@codeatlasdev/ui`): page templates, app shell, data tables, charts, forms and overlays, with a Liquid Glass material system, an OKLCH theme engine and native-feeling mobile behavior. Built on bits-ui. Install with `bun add @codeatlasdev/ui`.",
		intro: [`Full documentation in one file: ${SITE}/llms-full.txt`],
		sections: [
			...GROUPS.map((heading) => ({
				heading,
				links: flat
					.filter((d) => d.group === heading)
					.map((d) => ({
						title: d.title,
						href: `${SITE}${docHref(d.slug)}`,
						description: d.description,
					})),
			})),
			{
				heading: "Optional",
				links: [
					{
						title: "Agent guide (AGENTES.md)",
						href: "https://github.com/codeatlasdev/ui/blob/main/AGENTES.md",
						description: "critical rules, tokens, page template patterns.",
					},
					{
						title: "Source",
						href: "https://github.com/codeatlasdev/ui",
						description: "repository, issues and changelog.",
					},
					{
						title: "npm",
						href: "https://www.npmjs.com/package/@codeatlasdev/ui",
						description: "published package.",
					},
				],
			},
		],
	});
	return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
