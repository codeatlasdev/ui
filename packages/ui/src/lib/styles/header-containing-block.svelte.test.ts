import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import GlassAppBar from "../components/GlassAppBar/GlassAppBar.svelte";
import SiteHeader from "../components/SiteHeader/SiteHeader.svelte";

// #842: `backdrop-filter` on an element makes it the containing block of its `position: fixed`
// descendants, so a mobile menu panel (`fixed; inset: <top> 0 0`) inside a glass header collapsed to
// the header box. Glass headers paint the blur on a pseudo-element layer (`data-ca-blur-layer`).

const html = document.documentElement;
afterEach(() => {
	html.setAttribute("data-style", "solid");
	html.classList.remove("dark");
});

const panel = createRawSnippet(() => ({
	render: () =>
		'<div data-testid="fixed-panel" style="position:fixed;inset:60px 0 0 0;background:red"></div>',
}));

describe("header containing block", () => {
	for (const style of ["glass", "liquid", "frosted"])
		for (const [name, Component, slot] of [
			["SiteHeader", SiteHeader, "trailing"],
			["GlassAppBar", GlassAppBar, "children"],
		] as const)
			it(`${name} under data-style=${style}: fixed child spans viewport`, async () => {
				html.setAttribute("data-style", style);
				const screen = await render(Component, { [slot]: panel });
				const header = screen.getByRole("banner").element();
				const fixed = screen.getByTestId("fixed-panel").element();
				const rect = fixed.getBoundingClientRect();
				expect(rect.height, "fixed panel height").toBe(window.innerHeight - 60);
				expect(rect.width, "fixed panel width").toBe(document.documentElement.clientWidth);
				expect(rect.top).toBe(60);
				const cs = getComputedStyle(header);
				expect(
					cs.backdropFilter === "none" || cs.backdropFilter === "",
					"no backdrop-filter on the header"
				).toBe(true);
				expect(cs.filter).toBe("none");
				expect(cs.transform).toBe("none");
			});

	it("glass blur sits on ::before", async () => {
		html.setAttribute("data-style", "glass");
		const screen = await render(SiteHeader, {});
		const layer = getComputedStyle(
			screen.getByRole("banner").element(),
			"::before"
		) as CSSStyleDeclaration;
		expect(layer.backdropFilter).toMatch(/blur\(/);
		expect(layer.position).toBe("absolute");
		expect(layer.pointerEvents).toBe("none");
	});

	it("solid layer has no filter", async () => {
		html.setAttribute("data-style", "solid");
		const screen = await render(SiteHeader, {});
		const layer = getComputedStyle(
			screen.getByRole("banner").element(),
			"::before"
		) as CSSStyleDeclaration;
		expect(layer.backdropFilter).toBe("none");
	});
});
