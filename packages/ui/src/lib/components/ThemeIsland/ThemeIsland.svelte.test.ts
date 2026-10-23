import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Harness from "./ThemeIsland.test.svelte";

const html = document.documentElement;
const bg = (el: Element) => getComputedStyle(el).backgroundColor;

beforeEach(() => {
	html.setAttribute("data-preset", "amber");
	html.classList.add("dark");
});
afterEach(() => {
	html.removeAttribute("data-preset");
	html.removeAttribute("data-theme-scope");
	html.classList.remove("dark");
});

describe("ThemeIsland (#352)", () => {
	it("without `document` only the wrapper carries the island", async () => {
		const screen = await render(Harness, { preset: "ocean", scheme: "light" });
		const island = screen.container.querySelector(".ca-theme-island") as HTMLElement;
		expect(island.getAttribute("data-preset")).toBe("ocean");
		expect(island.getAttribute("data-theme-scope")).toBe("light");
		expect(html.getAttribute("data-preset")).toBe("amber");
		expect(html.classList.contains("dark")).toBe(true);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("`document` paints html and body like the island and restores them on unmount", async () => {
		const screen = await render(Harness, { preset: "ocean", scheme: "light", document: true });
		await settled();
		const island = screen.container.querySelector(".ca-theme-island") as HTMLElement;
		expect(html.getAttribute("data-preset")).toBe("ocean");
		expect(html.getAttribute("data-theme-scope")).toBe("light");
		expect(getComputedStyle(html).colorScheme).toBe("light");
		// The island's own surface, not the app's dark canvas, behind overscroll.
		expect(bg(html)).toBe(bg(island));
		expect(bg(html)).not.toBe("rgba(0, 0, 0, 0)");
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await screen.rerender({ show: false });
		expect(html.getAttribute("data-preset")).toBe("amber");
		expect(html.classList.contains("dark")).toBe(true);
		expect(html.hasAttribute("data-theme-scope")).toBe(false);
		expect(html.hasAttribute("data-ca-island")).toBe(false);
		expect(getComputedStyle(html).colorScheme).toBe("dark");
	});

	it("a dark island inside a light app is dark on html too", async () => {
		html.classList.remove("dark");
		const screen = await render(Harness, { preset: "violet", scheme: "dark", document: true });
		await settled();
		expect(html.classList.contains("dark")).toBe(true);
		expect(getComputedStyle(html).colorScheme).toBe("dark");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		screen.unmount();
		expect(html.classList.contains("dark")).toBe(false);
		expect(html.getAttribute("data-preset")).toBe("amber");
	});

	it("follows a prop change and still restores the app", async () => {
		const screen = await render(Harness, { preset: "ocean", scheme: "light", document: true });
		await screen.rerender({ preset: "rose", scheme: "dark" });
		expect(html.getAttribute("data-preset")).toBe("rose");
		expect(html.getAttribute("data-theme-scope")).toBe("dark");
		screen.unmount();
		expect(html.getAttribute("data-preset")).toBe("amber");
		expect(html.hasAttribute("data-theme-scope")).toBe(false);
	});
});
