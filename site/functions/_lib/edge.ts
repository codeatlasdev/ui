// The release engine: the page never has a copy of "the latest release", it asks GitHub at the edge.
//
//   source     api.github.com/repos/codeatlasdev/ui/releases?per_page=100 (one request, newest first; tags other than
//              @codeatlasdev/ui@* are dropped by parseGithubReleases). 60 requests/hour per IP without a token, so the
//              answer is cached for TTL seconds in the Cache API (a new release shows within ~1 minute) and a
//              GITHUB_TOKEN binding, when configured, lifts the limit.
//   outage     if GitHub is down, slow or rate-limited, the last good copy is served (kept for a week) and flagged
//              `stale`; with nothing cached the error surfaces, and the page serves its own build-time body.
import { isRelease, parseGithubReleases, REPO, type Release } from "./changelog";

export const TTL = 60;
const KEEP = 86400 * 7;
const TIMEOUT = 8000;
const CACHE = "ca-ui-changelog-v1";

export interface Loaded {
	releases: Release[];
	/** true when GitHub could not be reached and the last good copy was served */
	stale: boolean;
}

interface Options {
	/** Skip the short-TTL copy and ask GitHub right now (`?fresh=1`). */
	fresh?: boolean;
	/** GitHub token; optional, only raises the API rate limit. */
	token?: string;
}

/** What this module stored itself: already parsed `Release[]`, so only the shape of the list is checked. */
async function readCached(res: Response): Promise<Release[]> {
	const stored: unknown = await res.json();
	if (!Array.isArray(stored)) throw new Error("corrupt cache entry");
	return stored.filter(isRelease);
}

async function fetchReleases(token?: string): Promise<Release[]> {
	const headers: Record<string, string> = {
		accept: "application/vnd.github+json",
		"user-agent": "codeatlas-ui-site-edge",
		"x-github-api-version": "2022-11-28",
	};
	if (token) headers.authorization = `Bearer ${token}`;
	const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, {
		headers,
		signal: AbortSignal.timeout(TIMEOUT),
	});
	if (!res.ok) throw new Error(`releases HTTP ${res.status}`);
	const releases = parseGithubReleases(await res.json());
	if (!releases.length) throw new Error("no published release");
	return releases;
}

/** Releases of the package, newest first: a fresh-enough cached copy, else GitHub, else the last good copy. */
export async function loadReleases({ fresh = false, token }: Options = {}): Promise<Loaded> {
	const cache = await caches.open(CACHE);
	const key = new Request("https://cache.invalid/releases");
	const lastKey = new Request("https://cache.invalid/releases/last");
	const hit = fresh ? undefined : await cache.match(key);
	if (hit) return { releases: await readCached(hit), stale: false };
	try {
		const releases = await fetchReleases(token);
		const body = JSON.stringify(releases);
		await cache.put(
			key,
			new Response(body, { headers: { "cache-control": `public, max-age=${TTL}` } })
		);
		await cache.put(
			lastKey,
			new Response(body, { headers: { "cache-control": `public, max-age=${KEEP}` } })
		);
		return { releases, stale: false };
	} catch (err) {
		const last = await cache.match(lastKey);
		if (last) return { releases: await readCached(last), stale: true };
		throw err;
	}
}

/** Shared response headers: a minute fresh at the edge and in browsers, a day of stale-while-revalidate, stale-if-error for outages. */
export const CACHE_CONTROL = `public, max-age=${TTL}, s-maxage=${TTL}, stale-while-revalidate=86400, stale-if-error=604800`;

/** Headers for every edge answer. A `stale` answer is short-lived so the next request retries GitHub. */
export function edgeHeaders(extra: Record<string, string> = {}, stale = false): Headers {
	const h = new Headers(extra);
	h.set("cache-control", stale ? "public, max-age=15, stale-while-revalidate=60" : CACHE_CONTROL);
	h.set("x-changelog-source", stale ? "stale-last-good" : "github-releases");
	return h;
}
