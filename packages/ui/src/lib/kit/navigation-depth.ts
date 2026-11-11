import { goto } from "$app/navigation";

/**
 * In-app navigation depth: +1 for each forward navigation inside the app (link, goto), -1 for each
 * step back. Kept by `<OverlayHistory />`; `back()` reads it to tell "there is an in-app page to go
 * back to" from "this page was the entry point" (a deep link, a reload, a new tab).
 */
let depth = 0;

/** Called by `<OverlayHistory />` from `afterNavigate`. `delta` is the history step of a `popstate`. */
export function trackNavigation(type: string, delta?: number | null): void {
	if (type === "link" || type === "goto" || type === "form") depth++;
	else if (type === "popstate") depth = Math.max(0, depth + (delta ?? -1));
}

/** Test hook: how many in-app steps the user can go back. */
export function navigationDepth(): number {
	return depth;
}

/**
 * The Back of a page header (`AppForm`, `AppSettings`, `PageShell`): `history.back()` when the
 * user arrived through in-app navigation, else `goto(fallback)` replacing the entry, so Back never
 * leaves the app and never loops between two pages.
 *
 *   <AppForm backHref="/users" onback={(e) => { e.preventDefault(); back("/users"); }}>
 */
export function back(fallback: string): void {
	if (depth > 0) history.back();
	else void goto(fallback, { replaceState: true });
}
