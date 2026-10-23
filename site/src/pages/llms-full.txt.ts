import { loadDocs } from "~/lib/docs";
import { docHref, GROUPS } from "~/lib/nav";
import { buildLlmsFull } from "../../../packages/ui/scripts/llms-full";

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
								slug: d.slug,
							},
						]
					: [];
			})
	);
	return new Response(buildLlmsFull({ site: SITE, docs }), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
