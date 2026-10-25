import type { GetStaticPaths } from "astro";
import { loadChangelog } from "~/lib/changelog/load";
import { releaseFileOf } from "../../../../../packages/ui/scripts/changelog-markdown";

/** `/llms/changelog/<version>.txt`: one release as markdown, with its post, numbers and every change linked to its PR. */
export const getStaticPaths = (async () => {
	const { pages, prose } = await loadChangelog();
	const file = releaseFileOf(pages, prose);
	return file.versions.map((version) => ({
		params: { version },
		props: { text: file.releases[version] ?? "" },
	}));
}) satisfies GetStaticPaths;

export function GET({ props }: { props: { text: string } }) {
	return new Response(props.text, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
