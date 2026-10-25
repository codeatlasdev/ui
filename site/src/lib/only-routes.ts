/**
 * `CA_SITE_ROUTES` (a JSON array of routes, set by `scripts/test-changed.ts` for a narrow run) limits the three
 * big dynamic pages (gallery 411, atlas 270, docs 160 pages: ~75 of the 80 s of page generation) to the routes the
 * diff reaches. Unset, the build is complete: release, `test:full` and a widened run never set it.
 */
const only: Set<string> | undefined = process.env.CA_SITE_ROUTES
	? new Set<string>(JSON.parse(process.env.CA_SITE_ROUTES))
	: undefined;

/** Keeps the entries whose route is wanted; every entry when no filter is set. */
export const onlyRoutes = <T>(entries: T[], route: (entry: T) => string): T[] =>
	only ? entries.filter((e) => only.has(route(e))) : entries;
