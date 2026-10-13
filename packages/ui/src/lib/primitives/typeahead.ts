export interface TypeaheadItem<T = HTMLElement> {
	el: T;
	text: string;
}

/**
 * Type-to-select: returns a keydown handler. Printable characters build a 500 ms buffer;
 * the first item (starting after the current match when cycling one repeated letter) whose
 * text starts with the buffer is passed to `onMatch`.
 */
export function createTypeahead<T = HTMLElement>(
	items: () => TypeaheadItem<T>[],
	onMatch: (el: T) => void,
	timeout = 500
) {
	let buffer = "";
	let timer: ReturnType<typeof setTimeout> | undefined;
	let last: T | undefined;

	return function onKeydown(e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
		if (e.key === " " && buffer === "") return; // Space activates, it does not start a search
		clearTimeout(timer);
		buffer += e.key.toLowerCase();
		timer = setTimeout(() => {
			buffer = "";
		}, timeout);

		const list = items();
		const repeated = buffer.length > 1 && [...buffer].every((c) => c === buffer[0]);
		const needle = repeated ? buffer[0] : buffer;
		let pool = list;
		if (repeated || buffer.length === 1) {
			// Cycle through items sharing the same first letter.
			const at = last === undefined ? -1 : list.findIndex((i) => i.el === last);
			pool = [...list.slice(at + 1), ...list.slice(0, at + 1)];
		}
		const hit = pool.find((i) => i.text.trim().toLowerCase().startsWith(needle));
		if (hit) {
			last = hit.el;
			e.preventDefault();
			onMatch(hit.el);
		}
	};
}
