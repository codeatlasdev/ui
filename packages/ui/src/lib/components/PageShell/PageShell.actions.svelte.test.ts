import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Host from "./PageShellActions.test.svelte";

const rect = (el: Element) => el.getBoundingClientRect();

async function mount(kind: "theme-toggle" | "icon-button" | "labeled" | "mixed") {
	await page.viewport(...VIEWPORTS.mobile);
	const screen = await render(Host, { kind });
	await settled();
	const actions = screen.container.querySelector(".ca-page-shell__actions") as HTMLElement;
	return { actions, children: [...actions.children] as HTMLElement[] };
}

describe("PageShell actions at 390px", () => {
	afterEach(async () => {
		await page.viewport(...VIEWPORTS.desktop);
	});

	for (const kind of ["theme-toggle", "icon-button"] as const) {
		it(`a lone ${kind} keeps its natural size and sits at the end`, async () => {
			const { actions, children } = await mount(kind);
			const [btn] = children;
			expect(children).toHaveLength(1);
			// Natural size: a square-ish icon control, not a full-width bar.
			expect(rect(btn).width).toBeLessThan(64);
			// End-aligned: right edge flush with the actions row.
			expect(Math.abs(rect(actions).right - rect(btn).right)).toBeLessThan(1);
		});
	}

	it("labeled buttons still share the row full-width", async () => {
		const { actions, children } = await mount("labeled");
		expect(children).toHaveLength(2);
		expect(Math.abs(rect(children[0]).left - rect(actions).left)).toBeLessThan(1);
		expect(Math.abs(rect(actions).right - rect(children[1]).right)).toBeLessThan(1);
	});

	it("a labeled button stretches while the icon control next to it stays natural", async () => {
		const { actions, children } = await mount("mixed");
		const [label, icon] = children;
		expect(rect(icon).width).toBeLessThan(64);
		expect(Math.abs(rect(actions).right - rect(icon).right)).toBeLessThan(1);
		expect(rect(label).width).toBeGreaterThan(rect(actions).width / 2);
	});
});
