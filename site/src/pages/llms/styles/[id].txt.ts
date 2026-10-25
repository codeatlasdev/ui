import type { GetStaticPaths } from "astro";
import { STYLE_LIST, type StyleDoc } from "~/data/styles/styles";
import { buildStyleMarkdown } from "../../../../../packages/ui/scripts/styles-markdown";

/** `/llms/styles/<id>.txt`: one design-style page as markdown, with each claim's source, strength and scope. */
export const getStaticPaths = (() =>
	STYLE_LIST.map((doc) => ({ params: { id: doc.id }, props: { doc } }))) satisfies GetStaticPaths;

export function GET({ props }: { props: { doc: StyleDoc } }) {
	return new Response(buildStyleMarkdown(props.doc), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
