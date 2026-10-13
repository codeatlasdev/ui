import { afterEach, describe, expect, it, vi } from "vitest";
import { createTypeahead } from "./typeahead.js";

afterEach(() => vi.useRealTimers());

const items = ["Apple", "Banana", "Blueberry", "Cherry"].map((text) => ({ el: text, text }));
const press = (h: (e: KeyboardEvent) => void, key: string) =>
	h(new KeyboardEvent("keydown", { key, cancelable: true }));

describe("createTypeahead", () => {
	it("matches by prefix and builds a buffer", () => {
		vi.useFakeTimers();
		const onMatch = vi.fn();
		const h = createTypeahead(() => items, onMatch);
		press(h, "b");
		expect(onMatch).toHaveBeenLastCalledWith("Banana");
		press(h, "l");
		expect(onMatch).toHaveBeenLastCalledWith("Blueberry");
	});

	it("resets after 500 ms and cycles repeated letters", () => {
		vi.useFakeTimers();
		const onMatch = vi.fn();
		const h = createTypeahead(() => items, onMatch);
		press(h, "b");
		press(h, "b");
		expect(onMatch).toHaveBeenLastCalledWith("Blueberry");
		vi.advanceTimersByTime(501);
		press(h, "c");
		expect(onMatch).toHaveBeenLastCalledWith("Cherry");
	});

	it("ignores modifiers and non-printable keys", () => {
		const onMatch = vi.fn();
		const h = createTypeahead(() => items, onMatch);
		h(new KeyboardEvent("keydown", { key: "a", ctrlKey: true }));
		press(h, "ArrowDown");
		expect(onMatch).not.toHaveBeenCalled();
	});
});
