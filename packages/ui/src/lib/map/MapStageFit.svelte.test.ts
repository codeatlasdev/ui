import type { Map as GlMap } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { stageInsets } from "../stores/stage-insets.svelte.js";
import Harness from "./MapStage.test.svelte";

afterEach(() => stageInsets.reset());

const bounds: [[number, number], [number, number]] = [
	[-50, -25],
	[-40, -20],
];

/**
 * A frame inset of 200px on the 400px-wide harness canvas. The fit used to set the map's padding
 * and pass the same padding to `fitBounds` again, which subtracts it a second time: 200 + 200 left
 * no width, and maplibre threw `Invalid LngLat object: (-Infinity, NaN)` from the effect.
 */
describe("MapStage fit clear of a wide frame (#407)", () => {
	it("keeps the bounds inside the visible area and does not throw", async () => {
		const errors: string[] = [];
		const onError = (e: ErrorEvent) => {
			errors.push(e.message);
			e.preventDefault();
		};
		window.addEventListener("error", onError);
		try {
			let map: GlMap | undefined;
			stageInsets.set(Symbol("frame"), { top: 0, right: 0, bottom: 0, left: 200 });
			await render(Harness, { onready: (m: GlMap) => (map = m), fit: bounds });
			await vi.waitFor(() => expect(map?.getPadding().left).toBe(200), { timeout: 10_000 });
			// The fit animates; read the camera once it has landed, not mid-flight.
			await vi.waitFor(() => expect((map as GlMap).isMoving()).toBe(false), { timeout: 10_000 });
			const sw = (map as GlMap).project(bounds[0]);
			const ne = (map as GlMap).project(bounds[1]);
			// Visible area is x in [200, 400]: both corners fall inside it.
			expect(sw.x).toBeGreaterThanOrEqual(199);
			expect(ne.x).toBeLessThanOrEqual(401);
			expect(errors).toEqual([]);
		} finally {
			window.removeEventListener("error", onError);
		}
	});
});
