import { ScatterplotLayer } from "@deck.gl/layers";
import type { Map as GlMap } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { colorScheme } from "../stores/color-scheme.svelte.js";
import Harness from "./MapStage.test.svelte";

afterEach(() => colorScheme.setPreference("light"));

const stores = [
	{ coordinates: [-46.63, -23.55], sales: 90 },
	{ coordinates: [-43.17, -22.91], sales: 70 },
];

// The map engine and deck.gl must work together: a MapLibre release the deck.gl overlay cannot
// drive throws on every frame (#470: `Cannot read properties of undefined (reading 'height')`).
describe("MapStage with a deck.gl layer", () => {
	it("draws a ScatterplotLayer without page or console errors", async () => {
		const errors: string[] = [];
		const onError = (e: ErrorEvent) => {
			errors.push(e.message);
			e.preventDefault();
		};
		window.addEventListener("error", onError);
		const consoleError = vi.spyOn(console, "error").mockImplementation((...a) => {
			errors.push(a.map(String).join(" "));
		});
		try {
			let map: GlMap | undefined;
			await render(Harness, {
				onready: (m: GlMap) => (map = m),
				layers: [
					new ScatterplotLayer({
						id: "stores",
						data: stores,
						getPosition: (d: (typeof stores)[number]) => d.coordinates as [number, number],
						getRadius: (d: (typeof stores)[number]) => d.sales * 600,
						getFillColor: [245, 158, 11, 120],
					}),
				],
			});
			await vi.waitFor(() => expect(map?.isStyleLoaded()).toBe(true), { timeout: 10_000 });
			// The error fires per rendered frame: render a run of them, and the map's own `idle` event says
			// the last repaint finished, with no fixed wait.
			for (let i = 0; i < 5; i++) {
				map?.triggerRepaint();
				await new Promise((r) => requestAnimationFrame(() => r(null)));
			}
			await new Promise<void>((resolve) => map?.once("idle", () => resolve()));
			expect(errors).toEqual([]);
		} finally {
			window.removeEventListener("error", onError);
			consoleError.mockRestore();
		}
	});
});
