import { afterEach, describe, expect, it, vi } from "vitest";
import { rovingFocus } from "./roving.js";

afterEach(() => {
	document.body.innerHTML = "";
});

function setup(orientation: "horizontal" | "vertical" | "both" = "horizontal", loop = true) {
	document.body.innerHTML = `
		<div id="c">
			<button id="a">a</button>
			<button id="b" disabled>b</button>
			<button id="c1">c</button>
			<button id="d">d</button>
		</div>`;
	const c = document.querySelector<HTMLElement>("#c") as HTMLElement;
	const onMove = vi.fn();
	const stop = rovingFocus(c, { selector: "button", orientation, loop, onMove });
	const key = (k: string) =>
		(document.activeElement ?? document.body).dispatchEvent(
			new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })
		);
	const el = (id: string) => document.getElementById(id) as HTMLElement;
	return { stop, key, el, onMove };
}

describe("rovingFocus", () => {
	it("maintains one tab stop and skips disabled items", () => {
		const { el, stop } = setup();
		expect([el("a").tabIndex, el("c1").tabIndex, el("d").tabIndex]).toEqual([0, -1, -1]);
		stop();
	});

	it("arrows move among enabled items, wrapping with loop", () => {
		const { el, key, onMove, stop } = setup("horizontal");
		el("a").focus();
		key("ArrowRight");
		expect(document.activeElement).toBe(el("c1"));
		expect(el("c1").tabIndex).toBe(0);
		expect(el("a").tabIndex).toBe(-1);
		expect(onMove).toHaveBeenCalledWith(el("c1"));
		key("ArrowRight");
		key("ArrowRight");
		expect(document.activeElement).toBe(el("a"));
		key("ArrowLeft");
		expect(document.activeElement).toBe(el("d"));
		stop();
	});

	it("Home/End jump to the ends; no wrap when loop=false", () => {
		const { el, key, stop } = setup("horizontal", false);
		el("c1").focus();
		key("End");
		expect(document.activeElement).toBe(el("d"));
		key("ArrowRight");
		expect(document.activeElement).toBe(el("d"));
		key("Home");
		expect(document.activeElement).toBe(el("a"));
		stop();
	});

	it("orientation filters arrow keys", () => {
		const { el, key, stop } = setup("vertical");
		el("a").focus();
		key("ArrowRight");
		expect(document.activeElement).toBe(el("a"));
		key("ArrowDown");
		expect(document.activeElement).toBe(el("c1"));
		stop();
	});
});
