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
// viewport before every test; a test that needs a pointer moves it itself.
beforeEach(async () => {
	await cdp().send("Input.dispatchMouseEvent", { type: "mouseMoved", x: -1, y: -1 });
});
