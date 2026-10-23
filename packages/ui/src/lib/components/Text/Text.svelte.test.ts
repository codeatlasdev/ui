import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import "../../styles/type-roles.css";
import { defineTheme, themeCSS } from "../../theme/define.js";
import Button from "../Button/Button.svelte";
import Text from "./Text.svelte";

// #375: named type roles. Every assertion reads computed style, not class names.
const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const ROLES = ["title", "heading", "body", "label", "caption", "num"] as const;

let style: HTMLStyleElement | undefined;
afterEach(() => {
	style?.remove();
	style = undefined;
});
/** Apply `ThemeOptions.type` the way the app does: the compiled theme CSS in a <style>. */
function applyType(type: NonNullable<Parameters<typeof defineTheme>[0]>["type"]) {
	style = document.createElement("style");
	style.textContent = themeCSS(defineTheme({ type }));
	document.head.appendChild(style);
}
const px = (v: string) => Number.parseFloat(v);

describe("Text defaults reproduce the sizes components use today", () => {
	it("label is the label size, medium, with the label tracking", async () => {
		const screen = await render(Text, { role: "label", children: text("Name") });
		const cs = getComputedStyle(q(screen.container, ".ca-text"));
		const root = getComputedStyle(document.documentElement);
		const probe = document.createElement("span");
		probe.style.fontSize = "var(--ca-font-size-label)";
		document.body.appendChild(probe);
		const legacy = getComputedStyle(probe).fontSize;
		probe.remove();
		expect(cs.fontSize).toBe(legacy);
		expect(cs.fontWeight).toBe("500");
		expect(px(cs.letterSpacing)).toBeCloseTo(px(legacy) * 0.01, 1);
		expect(root.getPropertyValue("--ca-label-tracking").trim()).toBe("0.01em");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("every role renders at a distinct, positive size ladder: title > heading > body > label > caption", async () => {
		const sizes: Record<string, number> = {};
		for (const role of ROLES) {
			const screen = await render(Text, { role, children: text(role) });
			sizes[role] = px(getComputedStyle(q(screen.container, ".ca-text")).fontSize);
		}
		expect(sizes.title).toBeGreaterThan(sizes.heading);
		expect(sizes.heading).toBeGreaterThan(sizes.body);
		expect(sizes.body).toBeGreaterThan(sizes.label);
		expect(sizes.label).toBeGreaterThan(sizes.caption);
	});
});

describe("ThemeOptions.type changes the role everywhere, library components included", () => {
	it("a label override moves <Text role=label> and a library Button label", async () => {
		applyType({ label: { size: "20px", leading: 1.8, tracking: "0.1em", weight: 700 } });
		const t = await render(Text, { role: "label", children: text("Name") });
		const cs = getComputedStyle(q(t.container, ".ca-text"));
		expect(cs.fontSize).toBe("20px");
		expect(cs.fontWeight).toBe("700");
		expect(px(cs.lineHeight)).toBeCloseTo(36, 0);
		expect(px(cs.letterSpacing)).toBeCloseTo(2, 1);

		// A library component that never heard of the role: Button reads --ca-label-tracking, and the
		// body2/label size tokens that are now derived from the role.
		const b = await render(Button, { variant: "outlined", children: text("Save") });
		const btn = getComputedStyle(q(b.container, "button"));
		// `0.1em` resolves against the Button's own font size, so it is 10x the 0.01em default.
		expect(px(btn.letterSpacing)).toBeCloseTo(px(btn.fontSize) * 0.1, 1);
	});

	it("a partial override keeps the other parts at their defaults", async () => {
		applyType({ caption: { tracking: "0.2em" } });
		const t = await render(Text, { role: "caption", children: text("hint") });
		const cs = getComputedStyle(q(t.container, ".ca-text"));
		expect(px(cs.letterSpacing)).toBeCloseTo(px(cs.fontSize) * 0.2, 1);
		expect(px(cs.fontSize)).toBeLessThan(14);
	});
});

describe("num role", () => {
	it("renders tabular digits: 1111 and 8888 are as wide", async () => {
		const a = await render(Text, { role: "num", children: text("1111") });
		const b = await render(Text, { role: "num", children: text("8888") });
		const wa = q(a.container, ".ca-text").getBoundingClientRect().width;
		const wb = q(b.container, ".ca-text").getBoundingClientRect().width;
		expect(getComputedStyle(q(a.container, ".ca-text")).fontVariantNumeric).toContain(
			"tabular-nums"
		);
		expect(wa).toBeCloseTo(wb, 1);
		expect(await checkA11y(a.container)).toHaveNoViolations();
	});

	it("a counter ticking does not change the width of its box", async () => {
		const widths = new Set<number>();
		for (const n of ["10:00", "10:08", "11:11", "18:88"]) {
			const s = await render(Text, { role: "num", children: text(n) });
			widths.add(Math.round(q(s.container, ".ca-text").getBoundingClientRect().width * 10));
		}
		expect(widths.size).toBe(1);
	});
});

describe("Text element and a11y", () => {
	it("renders a span by default and the tag given by `as`", async () => {
		const a = await render(Text, { role: "body", children: text("x") });
		expect(q(a.container, ".ca-text").tagName).toBe("SPAN");
		const b = await render(Text, { role: "body", as: "p", children: text("x") });
		expect(q(b.container, ".ca-text").tagName).toBe("P");
		expect(await checkA11y(b.container)).toHaveNoViolations();
	});

	it("the role utility classes apply the same bundle to any element", async () => {
		const el = document.createElement("div");
		el.className = "ca-text-label";
		el.textContent = "Raw";
		document.body.appendChild(el);
		const cs = getComputedStyle(el);
		expect(cs.fontWeight).toBe("500");
		expect(cs.fontSize).not.toBe("");
		el.remove();
	});
});
