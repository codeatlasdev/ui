// GET /changelog.json -> every release as data, newest first:
// { releases: [{ version, id, date, channel, url, npm, html, thanks, headline?, post? }] }; `html` is the full post when the
// release has one (`headline` and `post`, its page, are set then). Same source and cache as the page.
import { renderRelease } from "./_lib/changelog";
import { edgeHeaders, loadPosts, loadReleases } from "./_lib/edge";

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
		return Response.json(
			{ releases: releases.map((r) => renderRelease(r, posts[r.version])) },
			{ headers: edgeHeaders({ "access-control-allow-origin": "*" }, stale) }
		);
	} catch (err) {
		return Response.json(
			{ error: "changelog_unavailable", detail: String(err) },
			{ status: 502, headers: { "cache-control": "no-store" } }
		);
	}
};

// HEAD answers like GET (Pages routes methods separately); the body is dropped by the runtime.
export const onRequestHead = onRequestGet;
