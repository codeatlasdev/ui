import { flushSync } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createListbox, type ListboxItem } from "./listbox.svelte.js";

afterEach(() => {
	document.body.innerHTML = "";
	vi.useRealTimers();
});

function setup(mode: "activedescendant" | "roving" = "activedescendant") {
	const host = document.createElement("div");
	host.setAttribute("role", "listbox");
	const data = [
		{ id: "o-apple", text: "Apple", disabled: false },
		{ id: "o-banana", text: "Banana", disabled: true },
		{ id: "o-blue", text: "Blueberry", disabled: false },
		{ id: "o-cherry", text: "Cherry", disabled: false },
	];
	const els = data.map((d) => {
		const el = document.createElement("div");
		el.id = d.id;
		el.setAttribute("role", "option");
		el.tabIndex = -1;
		host.appendChild(el);
		return el;
	});
	document.body.appendChild(host);
	const items: ListboxItem[] = data.map((d, i) => ({ ...d, el: () => els[i] }));
	const onSelect = vi.fn();
	const lb = createListbox({ items: () => items, onSelect, mode });
	const key = (k: string) =>
		lb.onkeydown(new KeyboardEvent("keydown", { key: k, cancelable: true }));
	return { lb, key, onSelect, els };
}

describe("Listbox", () => {
	it("ArrowDown/ArrowUp move the highlight, skip disabled, and wrap", () => {
		const { lb, key } = setup();
		key("ArrowDown");
		expect(lb.highlightedIndex).toBe(0);
		key("ArrowDown");
		expect(lb.highlightedIndex).toBe(2); // Banana is disabled
		key("ArrowUp");
		expect(lb.highlightedIndex).toBe(0);
		key("ArrowUp");
		expect(lb.highlightedIndex).toBe(3); // wrapped
	});

	it("Home/End jump to first/last enabled", () => {
		const { lb, key } = setup();
		key("End");
		expect(lb.highlightedIndex).toBe(3);
		key("Home");
		expect(lb.highlightedIndex).toBe(0);
	});

	it("exposes aria-activedescendant and does not move DOM focus", () => {
		const { lb, key, els } = setup();
		key("ArrowDown");
		flushSync();
		expect(lb.activeDescendant).toBe("o-apple");
		expect(document.activeElement).not.toBe(els[0]);
	});

	it("roving mode focuses the item and has no activedescendant", () => {
		const { lb, key, els } = setup("roving");
		key("ArrowDown");
		expect(document.activeElement).toBe(els[0]);
		expect(lb.activeDescendant).toBeUndefined();
	});

	it("Enter and Space select the highlighted item; nothing highlighted is a no-op", () => {
		const { key, onSelect } = setup();
		expect(key("Enter")).toBe(false);
		key("ArrowDown");
		key("Enter");
		expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: "o-apple" }), 0);
		key(" ");
		expect(onSelect).toHaveBeenCalledTimes(2);
	});

	it("typeahead highlights the matching enabled item", () => {
		vi.useFakeTimers();
		const { lb, key } = setup();
		key("c");
		expect(lb.highlightedIndex).toBe(3);
		vi.advanceTimersByTime(600);
		key("b");
		expect(lb.highlightedIndex).toBe(2); // Banana disabled → Blueberry
	});

	it("scrolls the highlighted item into view", () => {
		const { lb, els } = setup();
		const spy = vi.spyOn(els[3], "scrollIntoView");
		lb.highlight(3);
		expect(spy).toHaveBeenCalledWith({ block: "nearest" });
	});
});
