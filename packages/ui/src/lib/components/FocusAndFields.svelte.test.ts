import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import FocusAndFields from "./FocusAndFields.test.svelte";

function toRgba(color: string): number[] {
	const c = document.createElement("canvas");
	c.width = c.height = 1;
	const ctx = c.getContext("2d", { willReadFrequently: true })!;
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
	return [r / 255, g / 255, b / 255, a / 255];
}
const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (c: number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a: number[], b: number[]) => {
	const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};
const over = (fg: number[], bg: number[]) =>
	[0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
function pageBackground(el: Element): number[] {
	const layers: number[][] = [];
	for (let n: Element | null = el.parentElement; n; n = n.parentElement) {
		const bg = toRgba(getComputedStyle(n).backgroundColor);
		if (bg[3] > 0) layers.push(bg);
	}
	let out = [1, 1, 1, 1];
	for (const l of layers.reverse()) out = [...over(l, out), 1];
	return out;
}

describe("field borders (#20)", () => {
	it("every field-like control draws a >= 3:1 edge against its parent", async () => {
		const screen = await render(FocusAndFields);
		const sel = [
			".ca-tf__wrap",
			".ca-ta__wrap",
			".ca-nf__wrap",
			".ca-sel__trigger",
			".ca-combobox__trigger",
			".ca-pin__cell",
			".ca-checkbox",
			".ca-radio-input",
		];
		const failures: string[] = [];
		for (const s of sel) {
			const el = screen.container.querySelector<HTMLElement>(s);
			expect(el, s).not.toBeNull();
			const edge = toRgba(getComputedStyle(el!).borderTopColor);
			const bg = pageBackground(el!);
			const r = ratio(over(edge, bg), bg);
			if (r < 3) failures.push(`${s} ${r.toFixed(2)}:1`);
		}
		expect(failures).toEqual([]);
	});
});

describe("--ca-focus-ring is the one knob (#24)", () => {
	it("setting it on :root recolours the ring of every focusable control", async () => {
		const screen = await render(FocusAndFields);
		document.documentElement.style.setProperty("--ca-focus-ring", "rgb(255, 0, 0)");
		try {
			const targets: [string, string][] = [
				[".ca-btn", "outline"],
				[".ca-icon-btn", "outline"],
				[".ca-chip", "outline"],
				[".ca-checkbox__input", "outline"],
				[".ca-switch__input", "outline"],
				[".ca-seg__item", "outline"],
				[".ca-tabs-trigger", "outline"],
			];
			const wrong: string[] = [];
			for (const [s] of targets) {
				const el = screen.container.querySelector<HTMLElement>(s);
				expect(el, s).not.toBeNull();
				el!.focus();
				el!.matches(":focus-visible");
				// Controls that draw the ring on a wrapper (:has(input:focus-visible)) are read there.
				const holder = el!.closest<HTMLElement>(".ca-checkbox, .ca-switch, .ca-radio-input") ?? el!;
				const color = getComputedStyle(holder).outlineColor;
				if (color !== "rgb(255, 0, 0)") wrong.push(`${s} -> ${color}`);
			}
			expect(wrong).toEqual([]);
		} finally {
			document.documentElement.style.removeProperty("--ca-focus-ring");
		}
	});
});
