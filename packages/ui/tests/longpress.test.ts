import { afterAll, afterEach, beforeEach, describe, expect, it, jest } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
afterAll(() => GlobalRegistrator.unregister());

// Loaded after the DOM globals exist (the action touches none at import, but the rest of the suite
// follows the same order), so a static import cannot be hoisted above `register()`.
const { longpress } = await import("../src/lib/actions/longpress.js");

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
const wait = (ms: number) => jest.advanceTimersByTime(ms);
const ptr = (type: string, init: Record<string, unknown> = {}) =>
	new PointerEvent(type, {
		bubbles: true,
		pointerType: "touch",
		clientX: 10,
		clientY: 10,
		...init,
	});

function setup(param?: Parameters<typeof longpress>[1]) {
	const node = document.createElement("div");
	document.body.append(node);
	const fired: CustomEvent[] = [];
	node.addEventListener("longpress", (e) => fired.push(e as CustomEvent));
	const act = longpress(node, param as never);
	return { node, fired, act };
}

describe("longpress (#726)", () => {
	it("fires once after the duration with the press point and pointer type", () => {
		const { node, fired, act } = setup(30);
		node.dispatchEvent(ptr("pointerdown", { clientX: 12, clientY: 34, pointerType: "touch" }));
		wait(60);
		expect(fired).toHaveLength(1);
		expect(fired[0].detail).toEqual({ x: 12, y: 34, pointerType: "touch" });
		act?.destroy?.();
	});

	it("does not fire when the finger drags farther than the slop (a scroll)", () => {
		const { node, fired, act } = setup(30);
		node.dispatchEvent(ptr("pointerdown"));
		node.dispatchEvent(ptr("pointermove", { clientX: 10, clientY: 50 }));
		wait(60);
		expect(fired).toHaveLength(0);
		act?.destroy?.();
	});

	it("keeps firing when the jitter stays inside the slop", () => {
		const { node, fired, act } = setup(30);
		node.dispatchEvent(ptr("pointerdown"));
		node.dispatchEvent(ptr("pointermove", { clientX: 14, clientY: 12 }));
		wait(60);
		expect(fired).toHaveLength(1);
		act?.destroy?.();
	});

	it("does not fire after pointercancel (the browser took the gesture)", () => {
		const { node, fired, act } = setup(30);
		node.dispatchEvent(ptr("pointerdown"));
		node.dispatchEvent(ptr("pointercancel"));
		wait(60);
		expect(fired).toHaveLength(0);
		act?.destroy?.();
	});

	it("a second pointerdown clears the first timer instead of leaking it", () => {
		const { node, fired, act } = setup(30);
		node.dispatchEvent(ptr("pointerdown"));
		wait(15);
		node.dispatchEvent(ptr("pointerdown"));
		node.dispatchEvent(ptr("pointerup"));
		wait(60);
		expect(fired).toHaveLength(0);
		act?.destroy?.();
	});

	it("ignores a mouse press unless pointerTypes asks for it", () => {
		const a = setup(30);
		a.node.dispatchEvent(ptr("pointerdown", { pointerType: "mouse" }));
		wait(60);
		expect(a.fired).toHaveLength(0);
		a.act?.destroy?.();

		const b = setup({ duration: 30, pointerTypes: ["mouse"] });
		b.node.dispatchEvent(ptr("pointerdown", { pointerType: "mouse" }));
		wait(60);
		expect(b.fired).toHaveLength(1);
		b.act?.destroy?.();
	});

	it("swallows the click that follows a long press, once", () => {
		const { node, fired, act } = setup({ duration: 30 });
		let clicks = 0;
		node.addEventListener("click", () => clicks++);
		node.dispatchEvent(ptr("pointerdown"));
		wait(60);
		node.dispatchEvent(ptr("pointerup"));
		node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
		expect(fired).toHaveLength(1);
		expect(clicks).toBe(0);
		node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
		expect(clicks).toBe(1);
		act?.destroy?.();
	});

	it("preventClick: false leaves the click alone", () => {
		const { node, act } = setup({ duration: 30, preventClick: false });
		let clicks = 0;
		node.addEventListener("click", () => clicks++);
		node.dispatchEvent(ptr("pointerdown"));
		wait(60);
		node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
		expect(clicks).toBe(1);
		act?.destroy?.();
	});

	it("destroy removes every listener and the pending timer", () => {
		const { node, fired, act } = setup(30);
		node.dispatchEvent(ptr("pointerdown"));
		act?.destroy?.();
		wait(60);
		node.dispatchEvent(ptr("pointerdown"));
		wait(60);
		expect(fired).toHaveLength(0);
	});
});
