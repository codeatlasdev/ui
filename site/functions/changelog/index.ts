// GET /changelog/ -> the static page shell (header, nav, theme, styles from the last build) with the article swapped for the
// releases GitHub lists right now (edge-cached about a minute). If GitHub is down the last good copy is served; with none the
// static build's own body is served untouched (the offline fallback), so the page is never empty.
import { renderRelease } from "../_lib/changelog";
import { edgeHeaders, loadReleases } from "../_lib/edge";
import { changelogBody } from "../_lib/page";

const OPEN = "<!--CHANGELOG-->";
const CLOSE = "<!--/CHANGELOG-->";
const HTML = { "content-type": "text/html; charset=utf-8" };

interface Env {
	GITHUB_TOKEN?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, next, env }) => {
	// `next()` serves the static asset for this path: the shell, and the offline fallback body between the markers.
	// Always the GET body: a HEAD request would get an empty asset and look like a missing build.
	const html = await (await next(new Request(request.url))).text();
	const a = html.indexOf(OPEN);
	const b = html.indexOf(CLOSE);
	if (a < 0 || b < a) return new Response(html, { headers: edgeHeaders(HTML, true) });
	try {
		const { releases, stale } = await loadReleases({
			fresh: new URL(request.url).searchParams.get("fresh") === "1",
			token: env.GITHUB_TOKEN,
		});
		// The build copy (between the markers) only matters when GitHub fails, so it is not parsed again here.
		const body = changelogBody(releases.map(renderRelease), { stale });
		return new Response(`${html.slice(0, a)}${body}${html.slice(b + CLOSE.length)}`, {
			headers: edgeHeaders({ ...HTML, "x-changelog-latest": releases[0]?.version ?? "" }, stale),
		});
	} catch {
		return new Response(html, { headers: edgeHeaders(HTML, true) });
	}
};

// HEAD answers like GET (Pages routes methods separately); the body is dropped by the runtime.
export const onRequestHead = onRequestGet;
