// ─── Reduced motion / transparency stores ────────────────────────────────────

/**
 * `serverValue` is what the store holds where there is no `window` (SSR, prerender). On the client it reads
 * the media query as soon as the module loads, so a page that never calls `init()` still has the real value,
 * and hydration repairs any attribute the server snapshot wrote (#1102).
 */
function createMediaStore(query: string, serverValue: boolean) {
	let matches = $state(
		typeof window === "undefined"
			? serverValue
			: typeof window.matchMedia === "function" && window.matchMedia(query).matches
	);
	let teardown: (() => void) | undefined;

	/** Re-reads the query; the listener attaches once. Returns cleanup. */
	function init(): () => void {
		if (typeof window === "undefined") return () => {};
		const mq = window.matchMedia(query);
		matches = mq.matches;
		if (teardown) return teardown;
		const onChange = (e: MediaQueryListEvent) => {
			matches = e.matches;
		};
		mq.addEventListener("change", onChange);
		teardown = () => {
			mq.removeEventListener("change", onChange);
			teardown = undefined;
		};
		return teardown;
	}

	return {
		get value() {
			return matches;
		},
		init,
	};
}

/**
 * Reactive `prefers-reduced-motion: reduce` (`.value`). Call `reducedMotion.init()` once in the root layout
 * to follow changes; it returns a cleanup. `true` on the server: it cannot read the preference, so server
 * markup renders without motion and the client turns it on after reading the query (#1102).
 */
export const reducedMotion = createMediaStore("(prefers-reduced-motion: reduce)", true);
/** Reactive `prefers-reduced-transparency: reduce` (`.value`). Call `reducedTransparency.init()` once in the root layout; it returns a cleanup. */
export const reducedTransparency = createMediaStore(
	"(prefers-reduced-transparency: reduce)",
	false
);
