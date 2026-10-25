/**
 * Whether a build output (`packages/ui/dist`, `site/dist`) has to be rebuilt before the site is tested.
 * A dev run trusts file times: the output is stale when it is missing or a changed file is newer.
 * The land gate never does: it runs right after a rebase, which brings in sources that are not in the
 * PR's diff (so no changed file is "newer"), while the output may predate the rebase by hours (#591).
 */
export function distStale(o: { land: boolean; exists: boolean; changedAfter: boolean }): boolean {
	return o.land || !o.exists || o.changedAfter;
}
