import { loadDocs } from "~/lib/docs";
import { docHref, GROUPS } from "~/lib/nav";
// Repo AGENTS.md, inlined at build time (Vite `?raw`), so one fetch covers docs and agent rules.
import agentsMd from "../../../AGENTS.md?raw";
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
				return entry
					? [
							{
								group,
								title: d.title,
								url: docHref(d.slug),
								description: d.description,
								body: entry.body ?? "",
							},
						]
					: [];
			})
	);
	return new Response(buildLlmsFull({ site: SITE, docs, agentsMd }), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
