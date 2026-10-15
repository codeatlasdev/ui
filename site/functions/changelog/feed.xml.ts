// GET /changelog/feed.xml -> Atom feed of the releases, from the same source and cache as the page.
import { atomFeed, renderRelease } from "../_lib/changelog";
import { edgeHeaders, loadReleases } from "../_lib/edge";

interface Env {
	GITHUB_TOKEN?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
	try {
		const { releases, stale } = await loadReleases({
			fresh: new URL(request.url).searchParams.get("fresh") === "1",
			token: env.GITHUB_TOKEN,
		});
		return new Response(atomFeed(releases.map(renderRelease)), {
			headers: edgeHeaders({ "content-type": "application/atom+xml; charset=utf-8" }, stale),
		});
	} catch (err) {
		return new Response(`changelog unavailable: ${String(err)}`, {
			status: 502,
			headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
		});
	}
};

export const onRequestHead = onRequestGet;
