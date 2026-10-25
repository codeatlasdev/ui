/// <reference types="vitest/browser" />
import "vitest-browser-svelte";
import "../src/lib/styles/global.css";
import "./a11y";
import { beforeEach, expect } from "vitest";
import { cdp } from "vitest/browser";

// Guard: an overlay that leaks a `pointer-events: none` lock on <body> would make the next test
// unable to click anything ("<html> intercepts pointer events"). Fail with a clear message instead.
beforeEach(async () => {
	await expect
		.poll(() => document.body.style.pointerEvents, {
			timeout: 3_000,
			message: "<body> is still pointer-locked: the previous test left an overlay lock behind",
		})
		.not.toBe("none");
});

// The Playwright pointer is page state: a test that hovers or clicks leaves it where it ended, and
// the next test renders at the top-left, so `:hover` rules (filled Button fill, tooltips that open
// on hover) would start active and results would depend on file order (#405). Park it outside the
// viewport before a test; a test that needs a pointer moves it itself. The CDP round trip costs
// ~17 ms and almost no test moves the pointer, so it is only paid when a pointer event was seen since
// the last park. A new file starts "moved": the previous file may have left the pointer anywhere.
let pointerMoved = true;
for (const type of ["pointermove", "pointerdown", "pointerup", "mousemove"])
	window.addEventListener(type, () => (pointerMoved = true), { capture: true, passive: true });
beforeEach(async () => {
	if (!pointerMoved) return;
	await cdp().send("Input.dispatchMouseEvent", { type: "mouseMoved", x: -1, y: -1 });
	// the park itself fires no event in the page (it is outside the viewport), so this stays false
	pointerMoved = false;
});
