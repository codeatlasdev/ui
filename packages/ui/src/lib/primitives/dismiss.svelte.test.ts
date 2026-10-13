import { afterEach, describe, expect, it, vi } from "vitest";
import { dismissable } from "./dismiss.js";

const cleanups: Array<() => void> = [];
afterEach(() => {
	while (cleanups.length) cleanups.pop()?.();
	document.body.innerHTML = "";
});

function box() {
	const el = document.createElement("div");
	document.body.appendChild(el);
	return el;
}
const esc = () =>
	document.dispatchEvent(
		new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
	);

describe("dismissable layer stack", () => {
	it("Escape closes only the topmost layer, then the next one", () => {
		const a = vi.fn();
		const b = vi.fn();
		cleanups.push(dismissable(box(), { onDismiss: a }));
		const stopB = dismissable(box(), { onDismiss: b });
		cleanups.push(stopB);

		esc();
		expect(b).toHaveBeenCalledWith("escape");
		expect(a).not.toHaveBeenCalled();

		stopB();
		esc();
		expect(a).toHaveBeenCalledWith("escape");
	});

	it("outside pointerdown dismisses; inside and excluded elements do not", () => {
		const onDismiss = vi.fn();
		const node = box();
		const trigger = box();
		const outside = box();
		cleanups.push(dismissable(node, { onDismiss, exclude: () => [trigger] }));
		const down = (el: Element) =>
			el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

		down(node);
		down(trigger);
		expect(onDismiss).not.toHaveBeenCalled();
		down(outside);
		expect(onDismiss).toHaveBeenCalledExactlyOnceWith("outside");
	});

	it("only the top layer reacts to outside pointerdown", () => {
		const a = vi.fn();
		const b = vi.fn();
		cleanups.push(dismissable(box(), { onDismiss: a }));
		cleanups.push(dismissable(box(), { onDismiss: b }));
		box().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
		expect(b).toHaveBeenCalledOnce();
		expect(a).not.toHaveBeenCalled();
	});

	it("honours escape:false and outside:false, and reports focus-outside", () => {
		const onDismiss = vi.fn();
		const outside = document.createElement("button");
		document.body.appendChild(outside);
		cleanups.push(dismissable(box(), { onDismiss, escape: false, outside: false }));
		esc();
		outside.focus();
		expect(onDismiss).not.toHaveBeenCalled();

		const onDismiss2 = vi.fn();
		cleanups.push(dismissable(box(), { onDismiss: onDismiss2 }));
		outside.blur();
		outside.focus();
		expect(onDismiss2).toHaveBeenCalledWith("focus-outside");
	});

	it("cleanup stops reacting", () => {
		const onDismiss = vi.fn();
		const stop = dismissable(box(), { onDismiss });
		stop();
		esc();
		expect(onDismiss).not.toHaveBeenCalled();
	});
});
