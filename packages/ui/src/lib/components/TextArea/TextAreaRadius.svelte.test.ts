import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Harness from "./TextAreaRadius.test.svelte";

const cs = (el: Element) => getComputedStyle(el);
const q = (root: Element, sel: string) => root.querySelector(sel) as HTMLElement;

// `controlRadius: "pill"` writes exactly this declaration on <html> (designTokens, #834).
const PILL = "--ca-radius-control: var(--ca-radius-pill)";

describe("TextArea radius under controlRadius pill (#834)", () => {
	it("a single-line field keeps the pill", async () => {
		const screen = await render(Harness, { style: PILL });
		const wrap = q(screen.container, ".ca-tf__wrap");
		// The wrap clamps 999px to half its height: any value past the box means the pill is applied.
		expect(Number.parseFloat(cs(wrap).borderTopLeftRadius)).toBeGreaterThan(900);
	});

	it("a multi-line field never becomes a stadium", async () => {
		const screen = await render(Harness, { style: PILL });
		const wrap = q(screen.container, ".ca-ta__wrap");
		const radius = Number.parseFloat(cs(wrap).borderTopLeftRadius);
		expect(radius).toBeLessThan(40);
		expect(radius).toBeGreaterThan(0);
	});

	it("keeps the control radius when it is already small", async () => {
		const screen = await render(Harness, { style: "--ca-radius-control: 6px" });
		expect(cs(q(screen.container, ".ca-ta__wrap")).borderTopLeftRadius).toBe("6px");
	});

	it("--ca-radius-control-multiline overrides the derived value", async () => {
		const screen = await render(Harness, { style: `${PILL}; --ca-radius-control-multiline: 3px` });
		expect(cs(q(screen.container, ".ca-ta__wrap")).borderTopLeftRadius).toBe("3px");
	});
});
