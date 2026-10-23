import { CATALOG } from "~/demos/catalog";
import { demoSource } from "~/lib/demo-source";
import { loadDocs } from "~/lib/docs";
import { docHref, GROUPS } from "~/lib/nav";
import pkg from "../../../packages/ui/package.json";
import { buildLlmsIndex, ENTRY_PAGES, parseRecipes } from "../../../packages/ui/scripts/ai-entry";
import { demoSources, mdxToMarkdown } from "../../../packages/ui/scripts/mdx-to-markdown";

const SITE = "https://ui.codeatlas.com.br";

export async function GET() {
	const { entries, flat } = await loadDocs();
	const recipesEntry = entries.find((e) => e.id === ENTRY_PAGES.recipes);
	const body = recipesEntry?.body ?? "";
	const recipes = parseRecipes(mdxToMarkdown(body, demoSources(body, demoSource)));
	const text = buildLlmsIndex({
		docs: flat.map((d) => ({
			slug: d.slug,
			title: d.title,
			description: d.description,
			group: d.group,
		})),
		recipes,
		groups: GROUPS,
		href: (slug) => `${SITE}${docHref(slug)}`,
		version: pkg.version,
		counts: { demos: CATALOG.length },
	});
	return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
