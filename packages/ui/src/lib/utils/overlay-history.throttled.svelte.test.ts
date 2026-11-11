import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cdp, page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { VIEWPORTS } from "../../../tests/viewports";
import Harness from "./OverlayHistoryHarness.test.svelte";
import { bridgeOverlaysToHistory } from "./overlay-history.js";

// #858: a Back pressed in the same task as a close must not step past the page's own entry, however late the
// browser delivers the traversal. Same flow as overlay-history.svelte.test.ts under CDP CPU throttling, so the
// slow-machine ordering is reproduced on demand instead of only in a loaded land gate.
const state = () =>
	JSON.parse(document.querySelector('[data-testid="state"]')?.textContent ?? "{}") as Record<
		string,
		boolean
	>;
// real-time: popstate after history.go/back/traverseTo is delivered by the browser's own traversal, which no fake clock owns.
const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));

let stop = () => {};
beforeEach(async () => {
	await page.viewport(VIEWPORTS.mobile[0], VIEWPORTS.mobile[1]);
	if (history.state?.caOverlays)
		history.replaceState({ ...history.state, caOverlays: undefined }, "");
	stop = bridgeOverlaysToHistory();
	await cdp().send("Emulation.setCPUThrottlingRate", { rate: 40 });
});
afterEach(async () => {
	await cdp().send("Emulation.setCPUThrottlingRate", { rate: 1 });
	await settle(300);
	stop();
});

describe("bridgeOverlaysToHistory under 40x CPU throttle", () => {
	it("a Back in the same task as a close is the close: the page keeps its own entry (#858)", async () => {
		history.pushState({ sentinel: 1 }, "");
		history.pushState({ sentinel: 2 }, "");
		const screen = await render(Harness);
		await screen.getByRole("button", { name: "Open sheet" }).click();
		await expect.element(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
		);
		history.back();
		await settle(1500);
		expect(state().sheet).toBe(false);
		expect(history.state).toEqual({ sentinel: 2 });
	}, 90_000);
});
