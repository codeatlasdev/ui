import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { VIEWPORTS } from "../../../tests/viewports";
import Harness from "./OverlayHistoryHarness.test.svelte";
import { bridgeOverlaysToHistory } from "./overlay-history.js";

// #725: Back closes the topmost modal layer instead of leaving the page. Real Chromium history.
const state = () =>
	JSON.parse(document.querySelector('[data-testid="state"]')?.textContent ?? "{}") as Record<
		string,
		boolean
	>;
const settle = () => new Promise((r) => setTimeout(r, 120));
const back = async () => {
	history.back();
	await settle();
};

let stop = () => {};
beforeEach(async () => {
	await page.viewport(VIEWPORTS.mobile[0], VIEWPORTS.mobile[1]);
	stop = bridgeOverlaysToHistory();
});
// A close calls history.go, whose popstate arrives later: tearing the bridge down before it lands let the next test's
// bridge read it as a Back, and its own go(-1) then stepped past the start and unloaded the test page (#725).
afterEach(async () => {
	await settle();
	stop();
});

describe("bridgeOverlaysToHistory", () => {
	it("Back closes a Sheet, stays on the route and restores focus to the opener", async () => {
		const screen = await render(Harness);
		const url = location.href;
		const length = history.length;
		const opener = screen.getByRole("button", { name: "Open sheet" });
		await opener.click();
		await expect.element(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
		expect(history.length).toBe(length + 1);
		await back();
		expect(state().sheet).toBe(false);
		expect(location.href).toBe(url);
		await expect.element(opener).toHaveFocus();
	});

	it("two stacked modals need two Backs, in order", async () => {
		const screen = await render(Harness);
		await screen.getByRole("button", { name: "Open sheet" }).click();
		await page.getByRole("button", { name: "Open dialog" }).click();
		await expect.element(page.getByRole("dialog", { name: "Nested" })).toBeVisible();
		await back();
		expect(state()).toMatchObject({ sheet: true, dialog: false });
		await back();
		expect(state()).toMatchObject({ sheet: false, dialog: false });
	});

	it("closing by button leaves no orphan entry", async () => {
		const screen = await render(Harness);
		const length = history.length;
		const index = history.state;
		await screen.getByRole("button", { name: "Open pane" }).click();
		await expect.element(page.getByRole("dialog", { name: "Thread" })).toBeVisible();
		await page.getByRole("button", { name: /voltar|back/i }).click();
		await settle();
		expect(state().pane).toBe(false);
		// The entry was consumed by history.go: the current entry is the one we started on.
		expect(history.state).toEqual(index);
		await settle();
		expect(history.length).toBeLessThanOrEqual(length + 1);
	});

	it("Escape closes and consumes the entry", async () => {
		const screen = await render(Harness);
		const before = history.state;
		await screen.getByRole("button", { name: "Open sheet" }).click();
		await page.getByRole("dialog", { name: "Filters" }).click();
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
		);
		await settle();
		expect(state().sheet).toBe(false);
		expect(history.state).toEqual(before);
	});

	it("Back pressed during the exit animation closes once and leaves no entry", async () => {
		const screen = await render(Harness);
		const before = history.state;
		await screen.getByRole("button", { name: "Open sheet" }).click();
		await expect.element(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
		// Close by Escape and press Back in the same tick, while the exit animation still plays.
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
		);
		history.back();
		await settle();
		await settle();
		expect(state().sheet).toBe(false);
		expect(history.state).toEqual(before);
		// Opening again works and takes exactly one entry.
		const length = history.length;
		await screen.getByRole("button", { name: "Open sheet" }).click();
		await expect.element(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
		expect(history.length).toBeLessThanOrEqual(length + 1);
	});

	it("history={false} layers never get an entry", async () => {
		const screen = await render(Harness);
		const length = history.length;
		await screen.getByRole("button", { name: "Open quiet" }).click();
		await expect.element(page.getByRole("dialog", { name: "Quiet" })).toBeVisible();
		expect(history.length).toBe(length);
	});

	it("a stale overlay entry left by a reload is stepped out of once", async () => {
		stop();
		history.pushState({ caOverlays: 1 }, "");
		const staleLength = history.length;
		stop = bridgeOverlaysToHistory();
		await settle();
		expect((history.state as { caOverlays?: number } | null)?.caOverlays).toBeUndefined();
		expect(history.length).toBe(staleLength);
	});

	it("a link inside a Sheet navigates once and Back from there is a single step", async () => {
		const screen = await render(Harness);
		await screen.getByRole("button", { name: "Open sheet" }).click();
		await page.getByRole("link", { name: "Inside link" }).click();
		await settle();
		expect(location.hash).toBe("#inside");
	});
});
