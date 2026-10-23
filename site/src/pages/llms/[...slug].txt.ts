import type { GetStaticPaths } from "astro";
import { demoSource } from "~/lib/demo-source";
import { loadDocs } from "~/lib/docs";
import { docHref } from "~/lib/nav";
import { buildLlmsPage } from "../../../../packages/ui/scripts/ai-entry";
import { demoSources } from "../../../../packages/ui/scripts/mdx-to-markdown";

const SITE = "https://ui.codeatlas.com.br";

/** `/llms/<slug>.txt`: one docs page as markdown with the complete source of every demo. */
export const getStaticPaths = (async () => {
	const { entries, flat } = await loadDocs();
	const byId = new Map(entries.map((e) => [e.id, e]));
	return flat.flatMap((d) => {
		const entry = byId.get(d.slug);
		return entry ? [{ params: { slug: d.slug }, props: { doc: d, body: entry.body ?? "" } }] : [];
	});
}) satisfies GetStaticPaths;

export function GET({
	props,
}: {
	props: { doc: Awaited<ReturnType<typeof loadDocs>>["flat"][number]; body: string };
}) {
	const { doc, body } = props;
	const text = buildLlmsPage({
		site: SITE,
		doc: { ...doc, url: docHref(doc.slug), body },
		sources: demoSources(body, demoSource),
	});
	return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
