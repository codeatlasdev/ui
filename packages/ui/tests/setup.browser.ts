/// <reference types="vitest/browser" />
import "vitest-browser-svelte";
import "../src/lib/styles/global.css";
import "./a11y";
import { beforeEach, expect } from "vitest";

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
