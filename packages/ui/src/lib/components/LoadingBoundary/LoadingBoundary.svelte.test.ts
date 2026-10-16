import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./LoadingBoundary.test.svelte";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
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
		const screen = await render(Harness, { props: { delay: 20, minDuration: 400 } });
		const start = performance.now();
		await expect.poll(() => skeleton(screen.container)).not.toBeNull();
		release(screen);
		await wait(150);
		// Resolved already, but the placeholder still holds and the content stays hidden: no flash.
		expect(skeleton(screen.container)).not.toBeNull();
		expect(content(screen.container)?.checkVisibility()).toBe(false);
		await expect.poll(() => skeleton(screen.container), { timeout: 2000 }).toBeNull();
		// shown at ~delay (20 ms) after `start`; held 400 ms from then.
		expect(performance.now() - start).toBeGreaterThanOrEqual(400);
		expect(content(screen.container)?.checkVisibility()).toBe(true);
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
