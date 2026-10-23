import { demoSource } from "~/lib/demo-source";
import { loadDocs } from "~/lib/docs";
import { docHref, GROUPS } from "~/lib/nav";
import { buildLlmsFull } from "../../../packages/ui/scripts/llms-full";
import { demoSources } from "../../../packages/ui/scripts/mdx-to-markdown";

const SITE = "https://ui.codeatlas.com.br";

export async function GET() {
	const { entries, flat } = await loadDocs();
	const byId = new Map(entries.map((e) => [e.id, e]));
	const docs = GROUPS.flatMap((group) =>
		flat
			.filter((d) => d.group === group)
			.flatMap((d) => {
				const entry = byId.get(d.slug);
				const body = entry?.body ?? "";
				return entry
					? [
							{
								group,
								title: d.title,
								url: docHref(d.slug),
								description: d.description,
								body,
								sources: demoSources(body, demoSource),
							},
						]
					: [];
			})
	);
	return new Response(buildLlmsFull({ site: SITE, docs }), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
