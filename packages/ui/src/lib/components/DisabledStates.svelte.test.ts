import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import DisabledMatrix from "./DisabledMatrix.test.svelte";

/** Resolve any CSS colour (oklch, color-mix, var) to sRGB 0..1 + alpha through a canvas pixel. */
function toRgba(color: string): [number, number, number, number] {
	const c = document.createElement("canvas");
	c.width = c.height = 1;
	const ctx = c.getContext("2d", { willReadFrequently: true })!;
	ctx.clearRect(0, 0, 1, 1);
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
/** Colour of `el` with the elements behind it composited, walking up to the document. */
function effectiveBackground(el: Element): number[] {
	const layers: [number, number, number, number][] = [];
	for (let n: Element | null = el; n; n = n.parentElement) {
		const bg = getComputedStyle(n).backgroundColor;
		if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") layers.push(toRgba(bg));
	}
	let out: number[] = toRgba(getComputedStyle(document.body).backgroundColor || "white");
	if (out[3] === 0) out = [1, 1, 1, 1];
	for (const l of layers.reverse()) out = [0, 1, 2].map((i) => l[i] * l[3] + out[i] * (1 - l[3]));
	return out;
}

/** Elements that directly hold a text node. */
function textElements(root: Element): HTMLElement[] {
	const out: HTMLElement[] = [];
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	for (let n = walker.nextNode(); n; n = walker.nextNode())
		if (n.textContent?.trim() && n.parentElement) out.push(n.parentElement);
	return [...new Set(out)];
}

describe("disabled controls (#19)", () => {
	it("no element that carries text is dimmed with opacity", async () => {
		const screen = await render(DisabledMatrix);
		const root = screen.container.querySelector('[data-testid="disabled-matrix"]')!;
		const dimmed: string[] = [];
		for (const el of textElements(root)) {
			// The opacity of an element multiplies through its ancestors up to the matrix root.
			for (let n: Element | null = el; n && n !== root; n = n.parentElement)
				if (getComputedStyle(n).opacity !== "1")
					dimmed.push(`${n.tagName.toLowerCase()}.${[...n.classList].join(".")}`);
		}
		expect(dimmed).toEqual([]);
	});

	it("every disabled button variant draws its label >= 3:1 over its real fill", async () => {
		const screen = await render(DisabledMatrix);
		const buttons = [...screen.container.querySelectorAll<HTMLElement>(".ca-btn:disabled")];
		expect(buttons.length).toBeGreaterThanOrEqual(5);
		for (const b of buttons) {
			const fg = toRgba(getComputedStyle(b).color);
			const bg = effectiveBackground(b);
			expect(ratio(fg, bg), b.className).toBeGreaterThanOrEqual(3);
		}
	});
});
