import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Harness from "./CommandPalette.test.svelte";

// #97: a starved CPU (CI under load) turns every Playwright step into hundreds of ms. These are the
// same flows as CommandPalette.svelte.test.ts under CDP CPU throttling, so the slow-machine
// behaviour is reproduced on demand instead of only in the full suite.
const palette = () => page.getByRole("dialog", { name: "Command palette" });
const input = () => page.getByPlaceholder("Search…");

const open = async (props = {}) => {
	const screen = await render(Harness, props);
	await screen.getByRole("button", { name: "Open palette" }).click();
	await expect.element(palette()).toBeVisible();
	await expect.element(input()).toHaveFocus();
};

// minQueryLength: 40x is enough to exercise the open-time state race; 150x adds no signal here
// because the test has too many CDP steps to fit reliably within any reasonable budget at that rate.
describe("CommandPalette under 40x CPU throttle — minQueryLength (#97)", () => {
	beforeEach(async () => {
		await cdp().send("Emulation.setCPUThrottlingRate", { rate: 40 });
	});
	afterEach(async () => {
		await cdp().send("Emulation.setCPUThrottlingRate", { rate: 1 });
	});

	it("opens with clean state; minQueryLength filters at threshold", async () => {
		// open() proves: dialog mounts, input gets focus synchronously (no rAF race)
		await open({ minQueryLength: 3 });
		// At threshold → filter to one result; fill() = 1 CDP call, not per-char keyboard events
		await input().fill(" rep ");
		await expect.element(page.getByRole("option")).toHaveLength(1);
	});
});

// ArrowDown: both 40x and 150x exercise the selection-state race.
// Wall time at 150x scales with throttle; 30 s gives 2× margin over the 40x median × (150/40).
describe.each([40, 150])("CommandPalette under %dx CPU throttle — ArrowDown (#97)", (rate) => {
	const budget = rate >= 150 ? 30_000 : 15_000;

	beforeEach(async () => {
		await cdp().send("Emulation.setCPUThrottlingRate", { rate });
	});
	afterEach(async () => {
		await cdp().send("Emulation.setCPUThrottlingRate", { rate: 1 });
	});

	it(
		"ArrowDown/ArrowUp move aria-selected under load (#97)",
		async () => {
			// Minimal: one Down + one Up proves selection moves without rAF race.
			// Full clamping coverage lives in CommandPalette.svelte.test.ts (no throttle).
			await open();
			const options = page.getByRole("option");
			await expect.element(options.nth(0)).toHaveAttribute("aria-selected", "true");
			await userEvent.keyboard("{ArrowDown}");
			await expect.element(options.nth(1)).toHaveAttribute("aria-selected", "true");
			await userEvent.keyboard("{ArrowUp}");
			await expect.element(options.nth(0)).toHaveAttribute("aria-selected", "true");
		},
		budget
	);
});
