import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import Harness from "./CardNested.test.svelte";

// #915: a card inside a card takes a concentric radius (outer radius minus outer padding).
const el = (id: string) => document.querySelector(`[data-testid="${id}"]`) as HTMLElement;
const px = (v: string) => Number.parseFloat(v);
const radius = (e: HTMLElement) => px(getComputedStyle(e).borderTopLeftRadius);
const pad = (e: HTMLElement) => px(getComputedStyle(e).paddingTop);

describe("Card nested radius (#915)", () => {
	afterEach(() => vi.restoreAllMocks());

	// First: devWarn prints once per page, and every case below renders a nested card.
	it("warns in development when a Card sits directly inside a Card", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		await render(Harness, {});
		expect(warn.mock.calls.flat().join("\n")).toContain("nested-surface");
	});

	it("the inner card's radius is the outer radius minus the outer padding, never below 0", async () => {
		await render(Harness, {});
		const outer = el("outer");
		const expected = Math.max(0, radius(outer) - pad(outer));
		expect(radius(el("inner"))).toBeCloseTo(expected, 1);
		expect(radius(el("inner"))).toBeLessThan(radius(outer));
	});

	it("follows the outer card's padding step", async () => {
		await render(Harness, { padding: "sm" });
		const outer = el("outer");
		expect(radius(el("inner"))).toBeCloseTo(Math.max(0, radius(outer) - pad(outer)), 1);
	});

	it("a card on its own keeps its radius", async () => {
		await render(Harness, {});
		expect(radius(el("alone"))).toBe(radius(el("outer")));
	});
});
