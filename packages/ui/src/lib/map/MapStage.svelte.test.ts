import type { Map as GlMap } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import { colorScheme } from "../stores/color-scheme.svelte.js";
import { stageInsets } from "../stores/stage-insets.svelte.js";
import Harness from "./MapStage.test.svelte";

afterEach(() => {
	colorScheme.setPreference("light");
	stageInsets.reset();
});

async function mount(props: Record<string, unknown> = {}) {
	let map: GlMap | undefined;
	const screen = await render(Harness, { onready: (m: GlMap) => (map = m), ...props });
	await vi.waitFor(() => expect(map).toBeDefined(), { timeout: 10_000 });
	await vi.waitFor(() => expect(map?.isStyleLoaded()).toBe(true), { timeout: 10_000 });
	return { screen, map: map as GlMap };
}

const bg = (m: GlMap) => m.getPaintProperty("bg", "background-color");

describe("MapStage", () => {
	it("is a labelled region that passes axe, with controls", async () => {
		const { screen } = await mount();
		await expect.element(screen.getByRole("region", { name: "Test map" })).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Zoom in" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("starts with the style of the resolved scheme", async () => {
		colorScheme.setPreference("dark");
		const { map } = await mount();
		expect(bg(map)).toBe("#000000");
	});

	it("switches the style on a scheme change without recreating the map", async () => {
		const { map } = await mount();
		expect(bg(map)).toBe("#ffffff");
		colorScheme.setPreference("dark");
		await vi.waitFor(() => expect(bg(map)).toBe("#000000"), { timeout: 10_000 });
		expect(map.isStyleLoaded()).toBe(true);
		const again = document.querySelectorAll(".maplibregl-map").length;
		expect(again).toBe(1);
	});

	it("fitBounds honors the padding prop", async () => {
		const bounds: [[number, number], [number, number]] = [
			[-50, -25],
			[-40, -20],
		];
		const { map } = await mount({
			fit: bounds,
			padding: { top: 10, right: 10, bottom: 10, left: 150 },
		});
		await vi.waitFor(() => expect(map.getPadding().left).toBe(150), { timeout: 10_000 });
		const west = map.project([-50, -22]).x;
		expect(west).toBeGreaterThanOrEqual(150 - 1);
	});
});

describe("MapStage stage insets", () => {
	const bounds: [[number, number], [number, number]] = [
		[-50, -25],
		[-40, -20],
	];

	it("fits clear of the active PageFrame by default", async () => {
		stageInsets.set(Symbol("frame"), { top: 0, right: 0, bottom: 0, left: 120 });
		const { map } = await mount({ fit: bounds });
		await vi.waitFor(() => expect(map.getPadding().left).toBe(120), { timeout: 10_000 });
	});

	it("follows the frame when it moves", async () => {
		const key = Symbol("frame");
		stageInsets.set(key, { top: 0, right: 0, bottom: 0, left: 80 });
		const { map } = await mount({ fit: bounds });
		await vi.waitFor(() => expect(map.getPadding().left).toBe(80), { timeout: 10_000 });
		stageInsets.set(key, { top: 0, right: 0, bottom: 0, left: 200 });
		await vi.waitFor(() => expect(map.getPadding().left).toBe(200), { timeout: 10_000 });
	});

	it("an explicit padding side wins over the frame", async () => {
		stageInsets.set(Symbol("frame"), { top: 0, right: 0, bottom: 0, left: 120 });
		const { map } = await mount({ fit: bounds, padding: { left: 10 } });
		await vi.waitFor(() => expect(map.getPadding().left).toBe(10), { timeout: 10_000 });
	});
});

describe("MapControls", () => {
	it("zooms in and out with the buttons", async () => {
		const { screen, map } = await mount();
		const z = map.getZoom();
		await screen.getByRole("button", { name: "Zoom in" }).click();
		await vi.waitFor(() => expect(map.getZoom()).toBeGreaterThan(z), { timeout: 10_000 });
		await screen.getByRole("button", { name: "Zoom out" }).click();
		await vi.waitFor(() => expect(map.getZoom()).toBeLessThan(z + 1), { timeout: 10_000 });
	});

	it("resets the bearing with the compass", async () => {
		const { screen, map } = await mount();
		map.jumpTo({ bearing: 45 });
		await screen.getByRole("button", { name: "Reset north" }).click();
		await vi.waitFor(() => expect(Math.abs(map.getBearing())).toBeLessThan(0.5), {
			timeout: 10_000,
		});
	});

	it("uses 44px touch targets on coarse pointers", async () => {
		const { screen } = await mount();
		await page.viewport(390, 844);
		const btn = screen.getByRole("button", { name: "Zoom in" }).element() as HTMLElement;
		const r = btn.getBoundingClientRect();
		expect(Math.min(r.width, r.height)).toBeGreaterThanOrEqual(36);
	});
});

describe("reduced motion", () => {
	it("flyTo becomes jumpTo", async () => {
		const mq = vi.spyOn(window, "matchMedia").mockImplementation(
			(q: string) =>
				({
					matches: q.includes("prefers-reduced-motion"),
					media: q,
					addEventListener: () => {},
					removeEventListener: () => {},
				}) as unknown as MediaQueryList
		);
		const { screen, map } = await mount();
		const fly = vi.spyOn(map, "flyTo");
		const jump = vi.spyOn(map, "jumpTo");
		await screen.getByRole("button", { name: "Zoom in" }).click();
		expect(fly).not.toHaveBeenCalled();
		expect(jump).toHaveBeenCalled();
		mq.mockRestore();
	});
});
