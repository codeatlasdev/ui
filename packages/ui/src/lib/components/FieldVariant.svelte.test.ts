import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Harness from "./FieldVariant.test.svelte";

const cs = (el: Element) => getComputedStyle(el);
const q = (root: Element, sel: string) => root.querySelector(sel) as HTMLElement;
const SURFACES = [
	".ca-tf__wrap",
	".ca-sel__trigger",
	".ca-combobox__trigger",
	".ca-nf__wrap",
	".ca-date__wrap",
];

describe("field variant (#763)", () => {
	for (const variant of ["underline", "filled"] as const)
		it(`${variant}: every field computes a transparent border`, async () => {
			const screen = await render(Harness, { variant });
			for (const s of SURFACES)
				expect(cs(q(screen.container, s)).borderTopColor, s).toBe("rgba(0, 0, 0, 0)");
		});

	it("underline: bottom inset line, no fill, square corners", async () => {
		const screen = await render(Harness, { variant: "underline" });
		for (const s of SURFACES) {
			const el = q(screen.container, s);
			expect(cs(el).boxShadow, s).toMatch(/inset/);
			expect(cs(el).backgroundColor, s).toBe("rgba(0, 0, 0, 0)");
			expect(cs(el).borderTopLeftRadius, s).toBe("0px");
		}
	});

	it("filled: tinted background", async () => {
		const screen = await render(Harness, { variant: "filled" });
		for (const s of SURFACES)
			expect(cs(q(screen.container, s)).backgroundColor, s).not.toBe("rgba(0, 0, 0, 0)");
	});

	it("outlined (default) keeps a visible border", async () => {
		const screen = await render(Harness, {});
		expect(cs(q(screen.container, ".ca-tf__wrap")).borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
		expect(cs(q(screen.container, ".ca-sel__trigger")).borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
	});

	it("per-field variant wins over the theme-level one on <html>", async () => {
		document.documentElement.setAttribute("data-ca-field", "underline");
		try {
			const screen = await render(Harness, { variant: "filled" });
			expect(cs(q(screen.container, ".ca-tf__wrap")).boxShadow).not.toMatch(/inset 0px -1px/);
			expect(cs(q(screen.container, ".ca-tf__wrap")).borderTopLeftRadius).not.toBe("0px");
		} finally {
			document.documentElement.removeAttribute("data-ca-field");
		}
	});

	it("underline keeps a transparent border on hover and when open", async () => {
		const screen = await render(Harness, { variant: "underline" });
		const sel = q(screen.container, ".ca-sel__trigger");
		sel.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
		await sel.click();
		expect(cs(sel).borderTopColor).toBe("rgba(0, 0, 0, 0)");
	});

	it("height, radius and border width tokens reach the fields", async () => {
		const screen = await render(Harness, {
			style: "--ca-control-height: 52px; --ca-radius-control: 14px; --ca-field-border-width: 3px",
		});
		const wrap = q(screen.container, ".ca-tf__wrap");
		expect(cs(wrap).height).toBe("52px");
		expect(cs(wrap).borderTopLeftRadius).toBe("14px");
		expect(cs(wrap).borderTopWidth).toBe("3px");
		expect(cs(q(screen.container, ".ca-sel__trigger")).borderTopWidth).toBe("3px");
	});
});
