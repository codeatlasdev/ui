// ─── Reduced motion / transparency stores ────────────────────────────────────

function createMediaStore(query: string) {
	let matches = $state(false);
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

/** Reactive `prefers-reduced-motion: reduce` (`.value`). Call `reducedMotion.init()` once in the root layout; it returns a cleanup. */
export const reducedMotion = createMediaStore("(prefers-reduced-motion: reduce)");
/** Reactive `prefers-reduced-transparency: reduce` (`.value`). Call `reducedTransparency.init()` once in the root layout; it returns a cleanup. */
export const reducedTransparency = createMediaStore("(prefers-reduced-transparency: reduce)");
