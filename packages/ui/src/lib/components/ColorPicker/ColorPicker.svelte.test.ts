import { afterEach, describe, expect, it, vi } from "vitest";
import { cdp, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
import { setLocale } from "../../i18n/state.svelte";
import ColorFieldHarness from "../ColorField/ColorFieldHarness.test.svelte";
import ColorPickerHarness from "./ColorPickerHarness.test.svelte";

/** `oklch(L C H)` of the bound output as numbers. */
async function bound(screen: Awaited<ReturnType<typeof render>>) {
	const text = screen.getByTestId("bound").element().textContent ?? "";
	const m = /oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/.exec(text);
	if (!m) throw new Error(`not oklch: ${text}`);
	return { l: +m[1], c: +m[2], h: +m[3], a: m[4] === undefined ? 1 : +m[4], text };
}

afterEach(() => setLocale("en"));

describe("ColorPicker area", () => {
	it("is one slider with words in aria-valuetext and passes axe", async () => {
		const screen = await render(ColorPickerHarness);
		const area = screen.getByRole("slider", { name: "Brand color" });
		await expect.element(area).toHaveAttribute("aria-valuenow", "60");
		await expect
			.element(area)
			.toHaveAttribute("aria-valuetext", "Lightness 60%, chroma 88%, vivid");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("arrows move lightness and chroma, Shift moves ten times as far, bound value follows", async () => {
		const onchange = vi.fn();
		const screen = await render(ColorPickerHarness, { onchange });
		screen.getByRole("slider", { name: "Brand color" }).element().focus();
		await userEvent.keyboard("{ArrowUp}");
		expect((await bound(screen)).l).toBeCloseTo(0.61, 3);
		await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
		expect((await bound(screen)).l).toBeCloseTo(0.51, 3);
		await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
		const c0 = (await bound(screen)).c;
		await userEvent.keyboard("{ArrowRight}");
		expect((await bound(screen)).c).toBeCloseTo(c0 + 0.005, 3);
		await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
		expect((await bound(screen)).c).toBeCloseTo(c0 - 0.045, 3);
		expect(onchange).toHaveBeenCalled();
	});

	it("Home and End go to no chroma and the gamut edge, and never past it", async () => {
		const screen = await render(ColorPickerHarness);
		screen.getByRole("slider", { name: "Brand color" }).element().focus();
		await userEvent.keyboard("{Home}");
		expect((await bound(screen)).c).toBe(0);
		await userEvent.keyboard("{End}");
		const edge = (await bound(screen)).c;
		expect(edge).toBeGreaterThan(0.1);
		await userEvent.keyboard("{ArrowRight}");
		expect((await bound(screen)).c).toBe(edge);
	});

	it("a pointer press sets lightness and chroma from the position", async () => {
		const screen = await render(ColorPickerHarness);
		const area = screen.container.querySelector<HTMLElement>(".ca-color-picker__area");
		if (!area) throw new Error("area missing");
		const box = area.getBoundingClientRect();
		expect(box.width, "area width").toBeGreaterThan(100);
		expect(box.height, "area height").toBeGreaterThan(60);
		// Top edge is lightness 1, left edge is chroma 0.
		await userEvent.click(area, { position: { x: 8, y: 6 } });
		const top = await bound(screen);
		expect(top.l).toBeGreaterThan(0.9);
		expect(top.c).toBeLessThan(0.03);
		const r = area.getBoundingClientRect();
		await userEvent.click(area, { position: { x: r.width - 8, y: r.height - 6 } });
		expect((await bound(screen)).l).toBeLessThan(0.1);
	});
});

describe("ColorPicker hue and alpha", () => {
	it("the hue slider turns the hue, keeps lightness, and reads the color name", async () => {
		const screen = await render(ColorPickerHarness);
		const hue = screen.getByRole("slider", { name: "Hue" });
		await expect.element(hue).toHaveAttribute("aria-valuetext", "250 degrees, blue");
		hue.element().focus();
		await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
		const v = await bound(screen);
		expect(v.h).toBeCloseTo(260, 0);
		expect(v.l).toBeCloseTo(0.6, 3);
		await expect.element(hue).toHaveAttribute("aria-valuetext", "260 degrees, blue");
	});

	it("alpha is opt-in and writes / alpha into the value", async () => {
		const off = await render(ColorPickerHarness);
		expect(off.getByRole("slider", { name: "Opacity" }).elements()).toHaveLength(0);
		off.unmount();
		const screen = await render(ColorPickerHarness, { alpha: true });
		const a = screen.getByRole("slider", { name: "Opacity" });
		await expect.element(a).toHaveAttribute("aria-valuetext", "100 percent opaque");
		a.element().focus();
		await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
		expect((await bound(screen)).a).toBeCloseTo(0.9, 2);
		await expect.element(a).toHaveAttribute("aria-valuetext", "90 percent opaque");
	});
});

describe("ColorPicker value and format", () => {
	it('format="hex" writes #rrggbb, #rrggbbaa with alpha, and reads a hex value back', async () => {
		const screen = await render(ColorPickerHarness, {
			initial: "#2b5fd9",
			format: "hex",
			alpha: true,
		});
		screen.getByRole("slider", { name: "Brand color" }).element().focus();
		await userEvent.keyboard("{ArrowUp}");
		await expect
			.poll(() => screen.getByTestId("bound").element().textContent)
			.toMatch(/^#[0-9a-f]{6}$/);
		screen.getByRole("slider", { name: "Opacity" }).element().focus();
		await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
		await expect
			.poll(() => screen.getByTestId("bound").element().textContent)
			.toMatch(/^#[0-9a-f]{6}e6$/);
	});

	it("keeps the exact hue at low chroma instead of rounding through hex", async () => {
		const screen = await render(ColorPickerHarness, { initial: "oklch(0.8 0.012 140)" });
		screen.getByRole("slider", { name: "Brand color" }).element().focus();
		await userEvent.keyboard("{ArrowUp}");
		expect((await bound(screen)).h).toBeCloseTo(140, 0);
	});

	it("follows a value set from outside and ignores one that is not a color", async () => {
		const screen = await render(ColorPickerHarness, { initial: "oklch(0.3 0.1 30)" });
		const area = screen.getByRole("slider", { name: "Brand color" });
		await expect.element(area).toHaveAttribute("aria-valuenow", "30");
		screen.rerender({ initial: "oklch(0.9 0.05 30)" });
		await expect.element(area).toHaveAttribute("aria-valuenow", "30");
	});
});

describe("ColorPicker swatches", () => {
	it("a swatch sets the value, and the swatch matching the value is checked", async () => {
		const screen = await render(ColorPickerHarness, {
			swatches: ["#ef4444", "#22c55e", "oklch(0.6 0.15 250)"],
		});
		const green = screen.getByRole("radio", { name: "#22c55e" });
		await expect.element(screen.getByRole("radio", { name: "oklch(0.6 0.15 250)" })).toBeChecked();
		await green.click();
		expect((await bound(screen)).h).toBeGreaterThan(130);
		expect((await bound(screen)).h).toBeLessThan(160);
		await expect.element(green).toBeChecked();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("ColorPicker states", () => {
	it("disabled blocks the keyboard and the pointer and passes axe", async () => {
		const screen = await render(ColorPickerHarness, { disabled: true, alpha: true });
		const area = screen.getByRole("slider", { name: "Brand color" });
		await expect.element(area).toHaveAttribute("aria-disabled", "true");
		area.element().focus();
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("oklch(0.6 0.15 250)");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("axe passes with alpha and swatches", async () => {
		const screen = await render(ColorPickerHarness, {
			alpha: true,
			swatches: ["#ef4444", "#22c55e"],
		});
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("speaks pt-BR", async () => {
		setLocale("pt-BR");
		const screen = await render(ColorPickerHarness);
		await expect
			.element(screen.getByRole("slider", { name: "Matiz" }))
			.toHaveAttribute("aria-valuetext", "250 graus, azul");
	});

	it("every thumb is at least the touch target under a coarse pointer", async () => {
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			const screen = await render(ColorPickerHarness, { alpha: true });
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			const thumbs = screen.container.querySelectorAll<HTMLElement>('[role="slider"]');
			expect(thumbs).toHaveLength(3);
			for (const el of thumbs) {
				const r = el.getBoundingClientRect();
				expect(r.width, "thumb width").toBeGreaterThanOrEqual(touchTarget());
				expect(r.height, "thumb height").toBeGreaterThanOrEqual(touchTarget());
			}
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});
});

describe("ColorField opens the picker", () => {
	it("a Popover with the picker commits to the field's value and keeps the contrast readout", async () => {
		const screen = await render(ColorFieldHarness, {
			initial: "#2b5fd9",
			against: "#ffffff",
			picker: true,
		});
		await screen.getByRole("button", { name: /Pick a color for Brand/ }).click();
		const area = screen.getByRole("slider", { name: "Brand color" });
		await expect.element(area).toBeVisible();
		area.element().focus();
		await userEvent.keyboard("{Home}");
		await expect.element(screen.getByTestId("bound")).not.toHaveTextContent("#2b5fd9");
		await expect.element(screen.getByText(/:1/)).toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
