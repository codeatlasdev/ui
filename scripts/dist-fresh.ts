import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Whether a build output (`packages/ui/dist`, `site/dist`) has to be rebuilt before the site is tested.
 * A dev run trusts file times: the output is stale when it is missing or a changed file is newer.
 * The land gate never does: it runs right after a rebase, which brings in sources that are not in the
 * PR's diff (so no changed file is "newer"), while the output may predate the rebase by hours (#591).
 */
export function distStale(o: { land: boolean; exists: boolean; changedAfter: boolean }): boolean {
	return o.land || !o.exists || o.changedAfter;
}

/**
 * What `site/dist` holds: `"all"` for a full build, or the routes a narrow build was limited to
 * (`CA_SITE_ROUTES`, site/src/lib/only-routes.ts). Written by the build itself (site/scripts/scope-integration.ts).
 */
export type DistScope = "all" | string[];

/** What `dist` was built with; `undefined` without a readable stamp: an unknown build covers nothing. */
export function readScope(dist: string): DistScope | undefined {
	const file = join(dist, ".ca-scope.json");
	if (!existsSync(file)) return undefined;
	try {
		return JSON.parse(readFileSync(file, "utf8")) as DistScope;
	} catch {
		return undefined;
	}
}

/** Whether a build of `have` contains every page a run needs (`needs` undefined = the whole site). */
export function distCovers(have: DistScope | undefined, needs: string[] | undefined): boolean {
	if (have === "all") return true;
	if (have === undefined || needs === undefined) return false;
	const built = new Set(have);
	return needs.every((r) => built.has(r));
}
