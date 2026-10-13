import { afterEach, describe, expect, it, vi } from "vitest";
import { lockScroll } from "./scroll-lock.js";

afterEach(() => {
	vi.restoreAllMocks();
	document.body.removeAttribute("style");
});

describe("lockScroll", () => {
	it("is ref-counted and restores previous inline styles", () => {
		document.body.style.overflow = "auto";
		const a = lockScroll();
		const b = lockScroll();
		expect(document.body.style.overflow).toBe("hidden");

		a();
		expect(document.body.style.overflow).toBe("hidden");
		a(); // double release is a no-op
		expect(document.body.style.overflow).toBe("hidden");
		b();
		expect(document.body.style.overflow).toBe("auto");
	});

	it("compensates the scrollbar width with padding-right and restores it", () => {
		// Headless Chromium uses overlay scrollbars (0 px), so simulate a classic 15 px one.
		vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
			window.innerWidth - 15
		);

		document.body.style.paddingRight = "4px";
		const release = lockScroll();
		expect(document.body.style.paddingRight).toBe("19px");
		release();
		expect(document.body.style.paddingRight).toBe("4px");
	});

	it("adds no padding when there is no scrollbar", () => {
		const release = lockScroll();
		expect(document.body.style.paddingRight).toBe("");
		release();
	});
});
