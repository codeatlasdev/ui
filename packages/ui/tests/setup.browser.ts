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

// The host decides prefers-reduced-transparency and prefers-reduced-motion: Windows with "Transparency effects" off
// reports `reduce` for the first (#1250), with "Animation effects" off or energy saver on for the second (#1296), and
// glass and animation assertions then read the reduced state the library correctly paints. The suite assumes no
// preference, like a default macOS or Linux; a test that wants `reduce` emulates it. One call carries both features
// (a second `setEmulatedMedia` would replace the first), and it is only paid on such a host or after a test left
// `reduce` emulated: `matchMedia` is read first.
const HOST_MEDIA = ["prefers-reduced-transparency", "prefers-reduced-motion"];
beforeEach(async () => {
	if (!HOST_MEDIA.some((name) => matchMedia(`(${name}: reduce)`).matches)) return;
	await cdp().send("Emulation.setEmulatedMedia", {
		features: HOST_MEDIA.map((name) => ({ name, value: "no-preference" })),
	});
});
