import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Stage from "../../../../../../site/src/demos/layout/app-shell/Stage.svelte";
import { VIEWPORTS } from "../../../../tests/viewports";

const errors: string[] = [];
const onError = (e: ErrorEvent) => {
	errors.push(e.message);
	e.preventDefault();
};
window.addEventListener("error", onError);
afterEach(() => {
	errors.length = 0;
});

// The docs page renders this demo; a tracked write inside its stage attachment looped forever
// (effect_update_depth_exceeded) and took the whole /docs/layout/app-shell/ route down.
describe("Stage demo (#343)", () => {
	it("renders without an effect loop and counts one mount", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Stage);
		await expect.element(page.getByText(/Stage mounted 1 time/)).toBeVisible();
		expect(errors).toEqual([]);
	});
});
