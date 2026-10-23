import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Kbd from "../Kbd/Kbd.svelte";
import Button from "./Button.svelte";
import IconButton from "./IconButton.svelte";

/**
 * #373: Button, IconButton and Kbd read component tokens (`--ca-btn-*`, `--ca-icon-btn-*`,
 * `--ca-kbd-*`) from the cascade. Unset, the computed style is what 4.5.0 drew; set on `:root`,
 * a wrapper or a theme, it changes without a selector against a `.ca-*` class.
 */
const label = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));
const icon = createRawSnippet(() => ({
	render: () => `<svg width="16" height="16" aria-hidden="true"></svg>`,
}));

const root = document.documentElement;
afterEach(() => {
	root.removeAttribute("style");
});

const cs = (el: Element) => getComputedStyle(el);
const btn = (screen: { getByRole: (r: "button") => { element: () => Element } }) =>
	screen.getByRole("button").element() as HTMLElement;

describe("Button tokens: defaults are the 4.5.0 look", () => {
	it("md draws weight 500, label tracking, gap space-1-5, control padding", async () => {
		const screen = await render(Button, { children: label("Save"), variant: "filled" });
		const s = cs(btn(screen));
		expect(s.fontWeight).toBe("500");
		expect(parseFloat(s.letterSpacing)).toBeCloseTo(parseFloat(s.fontSize) * 0.01, 2);
		expect(s.columnGap).toBe("6px");
		expect(s.paddingInlineStart).toBe("14px");
		expect(s.height).toBe("36px");
	});

	it("ghost reserves a border, like 4.5.0", async () => {
		const screen = await render(Button, { children: label("Ghost"), variant: "ghost" });
		expect(cs(btn(screen)).borderTopWidth).toBe("1px");
	});
});

describe("Button tokens: set on :root", () => {
	it("weight, tracking, line-height and gap", async () => {
		root.style.setProperty("--ca-btn-font-weight", "600");
		root.style.setProperty("--ca-btn-letter-spacing", "-0.01em");
		root.style.setProperty("--ca-btn-line-height", "1.25");
		root.style.setProperty("--ca-btn-gap", "8px");
		const screen = await render(Button, { children: label("Save"), variant: "filled" });
		const s = cs(btn(screen));
		expect(s.fontWeight).toBe("600");
		expect(parseFloat(s.letterSpacing)).toBeLessThan(0);
		expect(parseFloat(s.lineHeight)).toBeCloseTo(parseFloat(s.fontSize) * 1.25, 2);
		expect(s.columnGap).toBe("8px");
	});

	it("per-size tokens only reach their size", async () => {
		root.style.setProperty("--ca-btn-sm-padding-x", "12px");
		root.style.setProperty("--ca-btn-sm-font-size", "13px");
		root.style.setProperty("--ca-btn-lg-font-weight", "400");
		const sm = await render(Button, { children: label("S"), size: "sm" });
		const smStyle = cs(sm.getByRole("button", { name: "S" }).element());
		expect(smStyle.paddingInlineStart).toBe("12px");
		expect(smStyle.fontSize).toBe("13px");
		expect(smStyle.fontWeight).toBe("500");
		const lg = await render(Button, { children: label("L"), size: "lg" });
		expect(cs(lg.getByRole("button", { name: "L" }).element()).fontWeight).toBe("400");
	});

	it("a wrapper scopes the tokens", async () => {
		const screen = await render(Button, { children: label("In"), variant: "filled" });
		const el = screen.getByRole("button", { name: "In" }).element() as HTMLElement;
		expect(cs(el).columnGap).toBe("6px");
		(el.parentElement as HTMLElement).style.setProperty("--ca-btn-gap", "10px");
		expect(cs(el).columnGap).toBe("10px");
		expect(cs(root).getPropertyValue("--ca-btn-gap")).toBe("");
	});

	it("ghost border width 0 removes the 2px a ghost adds over the same label", async () => {
		const screen = await render(Button, { children: label("Same label"), variant: "ghost" });
		const el = screen.getByRole("button", { name: "Same label" }).element() as HTMLElement;
		const withBorder = el.getBoundingClientRect().width;
		root.style.setProperty("--ca-btn-ghost-border-width", "0px");
		expect(cs(el).borderTopWidth).toBe("0px");
		expect(withBorder - el.getBoundingClientRect().width).toBe(2);
	});

	it("disabled filled follows --ca-btn-disabled-bg", async () => {
		root.style.setProperty("--ca-btn-disabled-bg", "rgb(1, 2, 3)");
		const screen = await render(Button, {
			children: label("Off"),
			variant: "filled",
			disabled: true,
		});
		expect(cs(btn(screen)).backgroundColor).toBe("rgb(1, 2, 3)");
	});

	it("--ca-btn-sm-height sets the sm height", async () => {
		root.style.setProperty("--ca-btn-sm-height", "24px");
		const screen = await render(Button, { children: label("S"), size: "sm" });
		expect(cs(btn(screen)).height).toBe("24px");
	});

	it("is axe clean with tokens set", async () => {
		root.style.setProperty("--ca-btn-font-weight", "600");
		const screen = await render(Button, { children: label("Save"), variant: "filled" });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("IconButton tokens", () => {
	it("defaults: sm 32, md 40, lg 48", async () => {
		for (const [size, px] of [
			["sm", "32px"],
			["md", "40px"],
			["lg", "48px"],
		] as const) {
			const screen = await render(IconButton, { "aria-label": size, size, children: icon });
			const s = cs(screen.getByRole("button", { name: size }).element());
			expect(s.width).toBe(px);
			expect(s.height).toBe(px);
		}
	});

	it("--ca-icon-btn-size-sm resizes sm only", async () => {
		root.style.setProperty("--ca-icon-btn-size-sm", "36px");
		const sm = await render(IconButton, { "aria-label": "sm", size: "sm", children: icon });
		expect(cs(sm.getByRole("button", { name: "sm" }).element()).width).toBe("36px");
		const md = await render(IconButton, { "aria-label": "md", size: "md", children: icon });
		expect(cs(md.getByRole("button", { name: "md" }).element()).width).toBe("40px");
		expect(await checkA11y(sm.container)).toHaveNoViolations();
	});

	it("--ca-icon-btn-font-weight reaches the glyph text", async () => {
		root.style.setProperty("--ca-icon-btn-font-weight", "700");
		const screen = await render(IconButton, { "aria-label": "x", children: icon });
		expect(cs(screen.getByRole("button").element()).fontWeight).toBe("700");
	});
});

describe("Kbd tokens", () => {
	it("defaults keep the padded keycap", async () => {
		const screen = await render(Kbd, { children: label("K") });
		const k = screen.container.querySelector("kbd") as HTMLElement;
		expect(cs(k).minWidth).toBe("0px");
		expect(parseFloat(cs(k).lineHeight)).toBeCloseTo(parseFloat(cs(k).fontSize) * 1.4, 2);
	});

	it("--ca-kbd-size sets a square box, font size and line-height follow their tokens", async () => {
		root.style.setProperty("--ca-kbd-size", "20px");
		root.style.setProperty("--ca-kbd-font-size", "12px");
		root.style.setProperty("--ca-kbd-line-height", "1");
		const screen = await render(Kbd, { children: label("K") });
		const k = screen.container.querySelector("kbd") as HTMLElement;
		const s = cs(k);
		expect(s.minWidth).toBe("20px");
		expect(s.height).toBe("20px");
		expect(s.fontSize).toBe("12px");
		expect(s.lineHeight).toBe("12px");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
