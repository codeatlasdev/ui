import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Host from "./AppShellShortPanel.test.svelte";

const panelWidth = async () => {
	// The panel width is a spring: wait until the offset stops moving.
	let last = -1;
	for (let still = 0; still < 20; ) {
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		const w =
			(document.querySelector(".ca-panel") as HTMLElement | null)?.getBoundingClientRect().width ??
			0;
		still = w === last ? still + 1 : 0;
		last = w;
	}
	return last;
};

describe("AppShellLayout collapseShortPanel (#342)", () => {
	it("keeps a two-item panel open by default", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Host, {});
		await settled();
		expect(await panelWidth()).toBeGreaterThan(100);
	});

	it("collapses a module with two items to the rail when opted in", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Host, { collapseShortPanel: true });
		await settled();
		expect(await panelWidth()).toBe(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps the panel for a module with three items even when opted in", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Host, { collapseShortPanel: true, leaves: 3 });
		await settled();
		expect(await panelWidth()).toBeGreaterThan(100);
	});
});
