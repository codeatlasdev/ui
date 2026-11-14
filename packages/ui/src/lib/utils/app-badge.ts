// ─── App icon badge (Badging API) ─────────────────────────────────────────────
// No imports on purpose: a service worker loads this file through `@codeatlasdev/ui/utils/app-badge`
// so that it never bundles the package root, which imports every `.svelte` component.

interface BadgingNavigator {
	setAppBadge?: (contents?: number) => Promise<void>;
	clearAppBadge?: () => Promise<void>;
}

/**
 * Shows `count` on the installed app's icon with the Badging API, from a page or a service worker.
 * `0`, a negative number, `null`, `undefined` or anything that is not a number clears the badge. A
 * fraction is rounded down, a numeric string (an untyped push payload) is read as its number and the
 * value is capped at `Number.MAX_SAFE_INTEGER`, so a push handler and a page that hold the same total
 * make the same call. Never throws: resolves `false` when the browser has no Badging API or refuses the
 * call (app not installed, no permission), `true` once the browser accepted it.
 */
export async function setAppBadge(count: number | string | null | undefined): Promise<boolean> {
	const nav: BadgingNavigator | undefined =
		typeof navigator === "undefined" ? undefined : navigator;
	const n = Math.min(Math.floor(Number(count)), Number.MAX_SAFE_INTEGER);
	try {
		if (n > 0) {
			if (typeof nav?.setAppBadge !== "function") return false;
			await nav.setAppBadge(n);
		} else {
			if (typeof nav?.clearAppBadge !== "function") return false;
			await nav.clearAppBadge();
		}
		return true;
	} catch {
		return false;
	}
}
