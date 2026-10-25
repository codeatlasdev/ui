import { loadChangelog } from "~/lib/changelog/load";
import { releaseFileOf } from "../../../../packages/ui/scripts/changelog-markdown";

/** `/llms/changelog.txt`: every release, newest first, each linking its own file. */
export async function GET() {
	const { pages, prose } = await loadChangelog();
	return new Response(releaseFileOf(pages, prose).index, {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
