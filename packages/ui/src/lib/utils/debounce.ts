// ─── Debounce utility ─────────────────────────────────────────────────────────
/** Returns a function that calls `fn` once `delay` ms after its last invocation; earlier pending calls are dropped. */
export function debounce<T extends (...args: unknown[]) => unknown>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timer: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}
