import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./LoadingBoundary.test.svelte";

const release = (s: { component: unknown }) => (s.component as { release: () => void }).release();
const busy = (c: Element) => c.querySelector<HTMLElement>("[aria-busy='true']");
const skeleton = (c: Element) => c.querySelector(".ca-loading-boundary__pending .ca-skeleton");
const content = (c: Element) => c.querySelector("[data-testid=content]");

describe("LoadingBoundary", () => {
	it("shows nothing when the content resolves before `delay`", async () => {
		// A long delay keeps this deterministic under CPU load: the release always wins the race.
		const screen = await render(Harness, { props: { delay: 5000, minDuration: 0 } });
		await expect.poll(() => busy(screen.container)).not.toBeNull();
		expect(skeleton(screen.container)).toBeNull();
		release(screen);
		await expect.poll(() => content(screen.container)?.textContent).toBe("Loaded");
		expect(busy(screen.container)).toBeNull();
		expect(skeleton(screen.container)).toBeNull();
	});

	it("shows the skeleton after `delay` and marks the region busy", async () => {
		const screen = await render(Harness, { props: { delay: 60, minDuration: 0 } });
		await expect.poll(() => skeleton(screen.container)).not.toBeNull();
		expect(busy(screen.container)).not.toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		release(screen);
		await expect.poll(() => content(screen.container)?.textContent).toBe("Loaded");
		expect(busy(screen.container)).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps the placeholder at least `minDuration` once it showed", async () => {
		// A busy suite stalls the main thread between `delay` firing and the placeholder reaching the
		// DOM (here: 120 ms inside its render). The hold must still last `minDuration` from there (#307).
		// The placeholder stamps its own mount and unmount, so the hold is measured on the node the
		// user saw, not from before/after `render` and not from an observer that lags the DOM.
		const stamps: { mounted?: number; unmounted?: number } = {};
		const screen = await render(Harness, {
			props: { delay: 20, minDuration: 400, stamps, stall: 120 },
		});
		await expect.poll(() => stamps.mounted).toBeDefined();
		// Observe the region instead of polling it: on a stalled machine a poll can first run after the
		// 400 ms hold is over and read "ready", which says nothing about the hold. The observer callback
		// runs at the DOM change itself, so what it records is what the user would have seen.
		const states: string[] = [];
		let atHolding: { placeholderGone: boolean; contentVisible: boolean } | undefined;
		const observer = new MutationObserver(() => {
			const state = busy(screen.container)?.getAttribute("data-state") ?? "ready";
			if (states.at(-1) !== state) states.push(state);
			if (state === "holding" && !atHolding)
				atHolding = {
					placeholderGone: stamps.unmounted !== undefined,
					contentVisible: content(screen.container)?.checkVisibility() ?? false,
				};
		});
		observer.observe(screen.container, { subtree: true, childList: true, attributes: true });
		release(screen);
		// Resolved already, but the boundary holds: no flash of content.
		await expect.poll(() => states.includes("holding")).toBe(true);
		observer.disconnect();
		expect(atHolding).toEqual({ placeholderGone: false, contentVisible: false });
		await expect.poll(() => stamps.unmounted, { timeout: 4000 }).toBeDefined();
		expect((stamps.unmounted ?? 0) - (stamps.mounted ?? 0)).toBeGreaterThanOrEqual(400);
		await expect.poll(() => content(screen.container)?.checkVisibility()).toBe(true);
	});

	it("renders a custom `pending` snippet instead of the skeleton", async () => {
		const screen = await render(Harness, {
			props: { delay: 20, minDuration: 0, withPending: true },
		});
		await expect
			.poll(() => screen.container.querySelector("[data-testid=custom-pending]"))
			.not.toBeNull();
		expect(skeleton(screen.container)).toBeNull();
		release(screen);
		await expect.poll(() => content(screen.container)?.textContent).toBe("Loaded");
	});

	it("names the busy region for screen readers", async () => {
		const screen = await render(Harness, {
			props: { delay: 0, minDuration: 0, label: "Loading invoices" },
		});
		await expect.poll(() => busy(screen.container)).not.toBeNull();
		expect(
			busy(screen.container)?.getAttribute("aria-label") ?? busy(screen.container)?.textContent
		).toContain("Loading invoices");
	});
});
