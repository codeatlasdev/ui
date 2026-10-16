import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./SchemeAsset.test.svelte";

const visible = (el: Element) => (el as SVGElement).getBoundingClientRect().width > 0;

describe("SchemeAsset", () => {
	it("renders only the variant of the active scheme, in both schemes", async () => {
		const screen = await render(Harness, {});
		const light = screen.getByTestId("light").element();
		const dark = screen.getByTestId("dark").element();
		const html = document.documentElement;
		html.classList.remove("dark");
		expect([visible(light), visible(dark)]).toEqual([true, false]);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		html.classList.add("dark");
		try {
			expect([visible(light), visible(dark)]).toEqual([false, true]);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		} finally {
			html.classList.remove("dark");
		}
	});

	it("follows a data-theme-scope island inside the other scheme", async () => {
		const screen = await render(Harness, { scope: "dark" });
		expect([
			visible(screen.getByTestId("light").element()),
			visible(screen.getByTestId("dark").element()),
		]).toEqual([false, true]);
	});
});
