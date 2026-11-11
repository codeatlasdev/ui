import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import { settled } from "../../../tests/settled";
import { VIEWPORTS } from "../../../tests/viewports";
import Button from "../components/Button/Button.svelte";
import TextField from "../components/TextField/TextField.svelte";
import { defineTheme, themeCSS } from "./define.js";

// #354: the roles a preset sets reach the real components with no app CSS.
const html = document.documentElement;
const style = document.createElement("style");
style.textContent = themeCSS(
	defineTheme({
		presets: [
			{
				id: "night",
				color: "#f27636",
				colors: {
					dark: {
						brandFill: "#f27636",
						brandFillHover: "#f5934f",
						brandContrast: "#1a1208",
						// #706: light error text, darker solid fill with a near-white label.
						error: "oklch(0.72 0.16 25)",
						errorFill: "oklch(0.5 0.19 25)",
						errorContrast: "oklch(0.985 0.005 25)",
						// #695: a neutral edge that is not the brand-hued generated one.
						borderControl: "oklch(0.55 0.015 255)",
					},
				},
				sizes: { inputFontSize: "0.875rem" },
			},
		],
	})
);

afterEach(async () => {
	style.remove();
	html.classList.remove("dark");
	await page.viewport(...VIEWPORTS.desktop);
});

/** The render container is the preset island: the roles must reach the component through it. */
function inNight(container: HTMLElement) {
	document.head.append(style);
	html.classList.add("dark");
	container.setAttribute("data-preset", "night");
}

describe("preset button and field roles (#354)", () => {
	it("a filled Button inside the preset uses brandFill and brandContrast", async () => {
		const screen = await render(Button, { children: undefined, "aria-label": "Go" });
		inNight(screen.container);
		await settled();
		const cs = getComputedStyle(screen.container.querySelector(".ca-btn") as HTMLElement);
		expect(cs.backgroundColor).toBe("rgb(242, 118, 54)");
		expect(cs.color).toBe("rgb(26, 18, 8)");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a field takes the preset font size on desktop and 16px on a narrow screen", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(TextField, { label: "Email", value: "" });
		inNight(screen.container);
		const input = screen.container.querySelector("input") as HTMLElement;
		const rem = Number.parseFloat(getComputedStyle(html).fontSize);
		expect(getComputedStyle(input).fontSize).toBe(`${0.875 * rem}px`);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await page.viewport(...VIEWPORTS.mobile);
		expect(getComputedStyle(input).fontSize).toBe("16px");
	});
});

// #706: the solid destructive fill is its own role; `error` stays the light feedback colour.
describe("preset errorFill and errorContrast (#706)", () => {
	it("a destructive Button uses them, not the error text colour", async () => {
		const screen = await render(Button, { variant: "destructive", "aria-label": "Delete" });
		inNight(screen.container);
		await settled();
		const btn = screen.container.querySelector(".ca-btn") as HTMLElement;
		const probe = (c: string) => {
			const el = document.createElement("i");
			el.style.color = c;
			document.body.append(el);
			const out = getComputedStyle(el).color;
			el.remove();
			return out;
		};
		const cs = getComputedStyle(btn);
		expect(cs.backgroundColor).toBe(probe("oklch(0.5 0.19 25)"));
		expect(cs.color).toBe(probe("oklch(0.985 0.005 25)"));
		expect(cs.backgroundColor).not.toBe(probe("oklch(0.72 0.16 25)"));
	});
});

// #695: the control edge is a preset role; Button (neutral, outlined) and TextField both draw it.
describe("preset borderControl (#695)", () => {
	const probe = (c: string) => {
		const el = document.createElement("i");
		el.style.color = c;
		document.body.append(el);
		const out = getComputedStyle(el).color;
		el.remove();
		return out;
	};

	it("an outlined neutral Button draws its border with it", async () => {
		const screen = await render(Button, {
			variant: "outlined",
			tone: "neutral",
			"aria-label": "Cancel",
		});
		inNight(screen.container);
		await settled();
		const btn = screen.container.querySelector(".ca-btn") as HTMLElement;
		expect(getComputedStyle(btn).borderTopColor).toBe(probe("oklch(0.55 0.015 255)"));
	});

	it("a TextField edge resolves to it", async () => {
		const screen = await render(TextField, { label: "Email", value: "" });
		inNight(screen.container);
		await settled();
		const wrap = screen.container.querySelector(".ca-tf__wrap") as HTMLElement;
		expect(getComputedStyle(wrap).borderTopColor).toBe(probe("oklch(0.55 0.015 255)"));
	});
});
