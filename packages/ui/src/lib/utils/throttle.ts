// ─── Throttle utility ─────────────────────────────────────────────────────────
/** Returns a function that calls `fn` at most once per `limit` ms; calls inside the window are ignored. */
export function throttle<T extends (...args: unknown[]) => unknown>(
	fn: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle = false;
	return (...args: Parameters<T>) => {
		if (inThrottle) return;
		inThrottle = true;
		fn(...args);
		setTimeout(() => {
			inThrottle = false;
		}, limit);
	};
}
