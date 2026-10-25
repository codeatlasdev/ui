import { buildStylesIndex } from "../../../../packages/ui/scripts/styles-markdown";

/** `/llms/styles.txt`: the digest of every design-style page, each linking its own file. */
export function GET() {
	return new Response(buildStylesIndex(), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
