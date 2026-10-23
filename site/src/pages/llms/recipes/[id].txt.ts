import type { GetStaticPaths } from "astro";
import { demoSource } from "~/lib/demo-source";
import { loadDocs } from "~/lib/docs";
import {
	buildLlmsRecipe,
	ENTRY_PAGES,
	parseRecipes,
	type Recipe,
} from "../../../../../packages/ui/scripts/ai-entry";
import { demoSources, mdxToMarkdown } from "../../../../../packages/ui/scripts/mdx-to-markdown";

const SITE = "https://ui.codeatlas.com.br";

/** `/llms/recipes/<id>.txt`: one section of the recipes page, so an agent can fetch it without anchors. */
export const getStaticPaths = (async () => {
	const { entries } = await loadDocs();
	const body = entries.find((e) => e.id === ENTRY_PAGES.recipes)?.body ?? "";
	const recipes = parseRecipes(mdxToMarkdown(body, demoSources(body, demoSource)));
	return recipes.map((recipe) => ({ params: { id: recipe.id }, props: { recipe } }));
}) satisfies GetStaticPaths;

export function GET({ props }: { props: { recipe: Recipe } }) {
	return new Response(buildLlmsRecipe({ site: SITE, recipe: props.recipe }), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
