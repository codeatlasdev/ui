import { afterEach, describe, expect, it, vi } from "vitest";
import { createHoverIntent } from "./hover-intent.js";
import { createIds } from "./ids.js";
import { portal } from "./portal.js";

afterEach(() => {
	document.body.innerHTML = "";
	vi.useRealTimers();
});

describe("portal", () => {
	it("moves the node to body and removes it on destroy", () => {
		const host = document.createElement("section");
		const node = document.createElement("div");
		host.appendChild(node);
		document.body.appendChild(host);
		const cleanup = portal()(node);
		expect(node.parentElement).toBe(document.body);
		cleanup();
		expect(node.isConnected).toBe(false);
		expect(host.childNodes).toHaveLength(0);
	});

	it("false leaves the node in place; string target is resolved", () => {
		const host = document.createElement("section");
		const dest = document.createElement("div");
		dest.id = "dest";
		const node = document.createElement("div");
		host.appendChild(node);
		document.body.append(host, dest);
		portal(false)(node)();
		expect(node.parentElement).toBe(host);
		const cleanup = portal("#dest")(node);
		expect(node.parentElement).toBe(dest);
		cleanup();
	});
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
