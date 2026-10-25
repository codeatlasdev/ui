// GET /changelog/feed.xml -> Atom feed of the releases, from the same source and cache as the page. A release that has a
// post carries the full post in its entry; the others carry the GitHub release body.
import { atomFeed, renderRelease } from "../_lib/changelog";
import { edgeHeaders, loadPosts, loadReleases } from "../_lib/edge";

interface Env {
	GITHUB_TOKEN?: string;
	ASSETS?: { fetch(input: Request | string): Promise<Response> };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
	try {
		const { releases, stale } = await loadReleases({
			fresh: new URL(request.url).searchParams.get("fresh") === "1",
			token: env.GITHUB_TOKEN,
		});
		const posts = await loadPosts(request, env.ASSETS);
		return new Response(atomFeed(releases.map((r) => renderRelease(r, posts[r.version]))), {
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
