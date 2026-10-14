import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { SLOW_FLOW } from "../../../../tests/settled";
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

describe.each([40, 150])("CommandPalette under %dx CPU throttle (#97)", (rate) => {
	beforeEach(async () => {
		await cdp().send("Emulation.setCPUThrottlingRate", { rate });
	});
	afterEach(async () => {
		await cdp().send("Emulation.setCPUThrottlingRate", { rate: 1 });
	});

	it(
		"minQueryLength gates filtering on the trimmed query",
		async () => {
			await open({ minQueryLength: 3 });
			await input().fill("re");
			await expect.element(page.getByRole("option")).toHaveLength(3);
			await expect.element(page.getByText("General", { exact: true })).toBeVisible();

			await input().fill("  re  ");
			await expect.element(page.getByRole("option")).toHaveLength(3);

			await input().fill(" rep ");
			await expect.element(page.getByRole("option")).toHaveLength(1);
			await expect.element(page.getByRole("option", { name: /Reports/ })).toBeVisible();
		},
		SLOW_FLOW
	);

	it(
		"ArrowDown/ArrowUp move aria-selected and clamp at the ends",
		async () => {
			await open();
			const options = page.getByRole("option");
			await expect.element(options.nth(0)).toHaveAttribute("aria-selected", "true");
			await userEvent.keyboard("{ArrowDown}");
			await expect.element(options.nth(1)).toHaveAttribute("aria-selected", "true");
			await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
			await expect.element(options.nth(2)).toHaveAttribute("aria-selected", "true");
			await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}");
			await expect.element(options.nth(0)).toHaveAttribute("aria-selected", "true");
		},
		SLOW_FLOW
	);
});
