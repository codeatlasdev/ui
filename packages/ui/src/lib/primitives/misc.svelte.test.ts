import { afterEach, describe, expect, it, vi } from "vitest";
import { createHoverIntent } from "./hover-intent.js";
import { createIds } from "./ids.js";

afterEach(() => {
	document.body.innerHTML = "";
	vi.useRealTimers();
});

describe("createHoverIntent", () => {
	it("delays open and close, cancelling the opposite timer", () => {
		vi.useFakeTimers();
		const onOpenChange = vi.fn();
		const h = createHoverIntent({ openDelay: 300, closeDelay: 100, onOpenChange });
		h.enter();
		vi.advanceTimersByTime(299);
		expect(onOpenChange).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		h.leave();
		h.enter(); // cancels the pending close
		vi.advanceTimersByTime(500);
		expect(onOpenChange).toHaveBeenCalledTimes(2);
		h.set(false);
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});
});

describe("createIds", () => {
	it("derives related ids", () => {
		const ids = createIds("sel-1");
		expect(ids.part("content")).toBe("sel-1-content");
		expect(ids.item("option", 3)).toBe("sel-1-option-3");
	});
});
