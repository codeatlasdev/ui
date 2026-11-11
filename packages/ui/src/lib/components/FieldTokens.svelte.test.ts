import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Harness from "./FieldTokens.test.svelte";

const cs = (el: Element) => getComputedStyle(el);
const px = (v: string) => Number.parseFloat(v);

describe("field tokens", () => {
	it("field-gap reaches every field", async () => {
		const screen = await render(Harness, { style: "--ca-field-gap: 9px" });
		const roots = [".ca-tf", ".ca-sel", ".ca-combobox", ".ca-nf", ".ca-date"];
		for (const r of roots)
			expect(cs(screen.container.querySelector(r) as Element).rowGap, r).toBe("9px");
	});

	it("component gap wins over field-gap", async () => {
		const screen = await render(Harness, {
			style:
				"--ca-field-gap: 9px; --ca-sel-gap: 3px; --ca-cb-gap: 4px; --ca-nf-gap: 5px; --ca-date-gap: 6px",
		});
		const gap = (r: string) => cs(screen.container.querySelector(r) as Element).rowGap;
		expect([gap(".ca-sel"), gap(".ca-combobox"), gap(".ca-nf"), gap(".ca-date")]).toEqual([
			"3px",
			"4px",
			"5px",
			"6px",
		]);
	});

	it("label leading and tracking", async () => {
		const screen = await render(Harness, {
			style: "--ca-field-label-leading: 1.25; --ca-field-label-tracking: 2px",
		});
		for (const l of [
			".ca-tf__label",
			".ca-sel__label",
			".ca-combobox__label",
			".ca-nf__label",
			".ca-date__label",
		]) {
			const el = screen.container.querySelector(l) as HTMLElement;
			expect(px(cs(el).lineHeight) / px(cs(el).fontSize), l).toBeCloseTo(1.25, 2);
			expect(cs(el).letterSpacing, l).toBe("2px");
		}
	});

	it("hint leading and tracking", async () => {
		const screen = await render(Harness, {
			style: "--ca-field-hint-leading: 1.4; --ca-field-hint-tracking: 1px",
		});
		for (const h of [
			".ca-tf__hint",
			".ca-sel__hint",
			".ca-combobox__hint",
			".ca-nf__hint",
			".ca-date__hint",
		]) {
			const el = screen.container.querySelector(h) as HTMLElement;
			expect(px(cs(el).lineHeight) / px(cs(el).fontSize), h).toBeCloseTo(1.4, 2);
			expect(cs(el).letterSpacing, h).toBe("1px");
		}
	});

	it("typed text spacing and leading", async () => {
		const screen = await render(Harness, {
			style: "--ca-input-letter-spacing: 3px; --ca-input-line-height: 1.5",
		});
		for (const sel of [
			".ca-tf__input",
			".ca-sel__trigger",
			".ca-combobox__trigger",
			".ca-nf__input",
		]) {
			const el = screen.container.querySelector(sel) as HTMLElement;
			expect(cs(el).letterSpacing, sel).toBe("3px");
		}
		const input = screen.container.querySelector(".ca-tf__input") as HTMLElement;
		expect(px(cs(input).lineHeight) / px(cs(input).fontSize)).toBeCloseTo(1.5, 2);
	});

	it("unset keeps defaults", async () => {
		const screen = await render(Harness, {});
		const input = screen.container.querySelector(".ca-tf__input") as HTMLElement;
		expect(cs(input).letterSpacing).toBe("normal");
		expect(px(cs(input).lineHeight)).toBe(px(cs(input).fontSize));
		expect(cs(screen.container.querySelector(".ca-tf") as Element).rowGap).toBe(
			cs(document.documentElement).getPropertyValue("--ca-space-1") ? "4px" : "4px"
		);
	});

	it("empty below takes no gap", async () => {
		const screen = await render(Harness, {});
		const below = screen.container.querySelector(".ca-tf__below") as HTMLElement;
		expect(below, "snippet passed, wrapper rendered").not.toBeNull();
		expect(cs(below).display).toBe("none");
	});

	it("reveal button tokens", async () => {
		const screen = await render(Harness, {
			style:
				"--ca-tf-reveal-size: 44px; --ca-tf-reveal-radius: 11px; --ca-tf-reveal-icon-size: 20px",
		});
		const btn = screen.container.querySelector(".ca-tf__reveal") as HTMLElement;
		expect(cs(btn).width).toBe("44px");
		expect(cs(btn).height).toBe("44px");
		expect(cs(btn).borderTopLeftRadius).toBe("11px");
		expect(cs(btn.querySelector("svg") as Element).width).toBe("20px");
	});

	it("error ring none", async () => {
		const screen = await render(Harness, {
			error: "Nope",
			style: "--ca-tf-error-ring: none",
		});
		const wrap = screen.container.querySelector(".ca-tf__wrap") as HTMLElement;
		expect(cs(wrap).boxShadow).toBe("none");
		expect(cs(wrap).borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
	});
});
