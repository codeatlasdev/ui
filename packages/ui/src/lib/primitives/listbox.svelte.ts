import { createTypeahead } from "./typeahead.js";

export interface ListboxItem {
	/** DOM id of the option element (used for `aria-activedescendant`). */
	id: string;
	/** Resolves the rendered element (for scroll-into-view / roving focus). */
	el(): HTMLElement | null | undefined;
	/** Text used for typeahead. */
	text: string;
	disabled?: boolean;
}

export interface ListboxOptions {
	items: () => ListboxItem[];
	/** Enter / Space on the highlighted item. */
	onSelect?(item: ListboxItem, index: number): void;
	/** `activedescendant`: focus stays on the input/listbox, `aria-activedescendant` points at the item. `roving`: DOM focus moves to the item. */
	mode?: "activedescendant" | "roving";
	orientation?: "vertical" | "horizontal";
	loop?: boolean;
	/** Whether Space selects (false for combobox inputs, where Space is text). Default true. */
	spaceSelects?: boolean;
	/** Called when highlight changes. */
	onHighlight?(item: ListboxItem | undefined, index: number): void;
}

/**
 * Shared listbox/menu state: highlighted index, APG keyboard handling (arrows, Home/End,
 * Enter/Space, typeahead), disabled skipping and scroll-into-view.
 * Attach `onkeydown` to the focused element (listbox, menu, or the combobox input).
 */
export class Listbox {
	highlightedIndex = $state(-1);
	readonly #opts: ListboxOptions;
	readonly #typeahead;

	constructor(options: ListboxOptions) {
		this.#opts = options;
		this.#typeahead = createTypeahead<number>(
			() =>
				this.#opts
					.items()
					.map((item, i) => ({ el: i, text: item.disabled ? "\u0000" : item.text })),
			(i) => this.highlight(i)
		);
	}

	get items() {
		return this.#opts.items();
	}

	/** Item currently highlighted, if any. */
	get highlighted(): ListboxItem | undefined {
		return this.items[this.highlightedIndex];
	}

	/** Value for `aria-activedescendant` on the focused element (undefined in roving mode). */
	get activeDescendant(): string | undefined {
		if (this.#opts.mode === "roving") return undefined;
		return this.highlighted?.id;
	}

	isHighlighted(index: number) {
		return this.highlightedIndex === index;
	}

	highlight(index: number) {
		const items = this.items;
		if (index < 0 || index >= items.length || items[index].disabled) return;
		this.highlightedIndex = index;
		const el = items[index].el();
		if (el) {
			if (this.#opts.mode === "roving") el.focus({ preventScroll: true });
			el.scrollIntoView({ block: "nearest" });
		}
		this.#opts.onHighlight?.(items[index], index);
	}

	clear() {
		this.highlightedIndex = -1;
		this.#opts.onHighlight?.(undefined, -1);
	}

	first() {
		const i = this.items.findIndex((it) => !it.disabled);
		if (i >= 0) this.highlight(i);
	}

	last() {
		const items = this.items;
		for (let i = items.length - 1; i >= 0; i--) {
			if (!items[i].disabled) return this.highlight(i);
		}
	}

	next() {
		this.#step(1);
	}

	prev() {
		this.#step(-1);
	}

	#step(dir: 1 | -1) {
		const items = this.items;
		const n = items.length;
		if (n === 0) return;
		const loop = this.#opts.loop ?? true;
		let i = this.highlightedIndex;
		for (let tries = 0; tries < n; tries++) {
			i += dir;
			if (i < 0 || i >= n) {
				if (!loop) return;
				i = (i + n) % n;
			}
			if (!items[i].disabled) return this.highlight(i);
		}
	}

	/** Keydown handler; returns true when the event was consumed. */
	onkeydown = (e: KeyboardEvent): boolean => {
		if (e.ctrlKey || e.metaKey || e.altKey) return false;
		const horizontal = this.#opts.orientation === "horizontal";
		const nextKey = horizontal ? "ArrowRight" : "ArrowDown";
		const prevKey = horizontal ? "ArrowLeft" : "ArrowUp";
		switch (e.key) {
			case nextKey:
				e.preventDefault();
				this.highlightedIndex < 0 ? this.first() : this.next();
				return true;
			case prevKey:
				e.preventDefault();
				this.highlightedIndex < 0 ? this.last() : this.prev();
				return true;
			case "Home":
				e.preventDefault();
				this.first();
				return true;
			case "End":
				e.preventDefault();
				this.last();
				return true;
			case "Enter":
			case " ": {
				if (e.key === " " && this.#opts.spaceSelects === false) return false;
				const item = this.highlighted;
				if (!item) return false;
				e.preventDefault();
				this.#opts.onSelect?.(item, this.highlightedIndex);
				return true;
			}
		}
		if (this.#opts.spaceSelects === false && e.key === " ") return false;
		this.#typeahead(e);
		return false;
	};
}

export function createListbox(options: ListboxOptions): Listbox {
	return new Listbox(options);
}
