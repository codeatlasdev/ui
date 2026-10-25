import { buildAtlasIndexMarkdown } from "../../../../packages/ui/scripts/atlas-markdown";

/** `/llms/atlas.txt`: every atlas term by category, each linking its own file. */
export function GET() {
	return new Response(buildAtlasIndexMarkdown(), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
