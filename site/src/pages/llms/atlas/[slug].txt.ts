import type { GetStaticPaths } from "astro";
import { TERMS, termSlug } from "~/data/atlas/atlas";
import { buildTermMarkdown } from "../../../../../packages/ui/scripts/atlas-markdown";

/** `/llms/atlas/<slug>.txt`: one atlas term as markdown, with its caveats and sources. */
export const getStaticPaths = (() =>
	TERMS.map((term) => ({
		params: { slug: termSlug(term) },
		props: { term },
	}))) satisfies GetStaticPaths;

export function GET({ props }: { props: { term: (typeof TERMS)[number] } }) {
	return new Response(buildTermMarkdown(props.term), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
