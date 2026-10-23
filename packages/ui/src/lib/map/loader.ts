// ─── Lazy engine loading ─────────────────────────────────────────────────────
// maplibre-gl, mapbox-gl and deck.gl touch `window`/WebGL at import time, so they are only ever
// imported from `onMount` code through these functions. They are optional peers: a missing
// one produces an error that names the package to install.

import type { MapInstance } from "./types.js";

export interface EngineModule {
	Map: new (options: Record<string, unknown>) => MapInstance;
	/** mapbox-gl only. */
	accessToken?: string;
}

export async function loadEngine(engine: "maplibre" | "mapbox"): Promise<EngineModule> {
	const pkg = engine === "mapbox" ? "mapbox-gl" : "maplibre-gl";
	try {
		// mapbox-gl is not a dependency of this repo (an optional peer), so it has no types here.
		const mod = (await (engine === "mapbox"
			? import(/* @vite-ignore */ "mapbox-gl" as string)
			: import("maplibre-gl"))) as { default?: EngineModule } & EngineModule;
		return mod.default ?? mod;
	} catch (cause) {
		throw new Error(
			`[ca-ui] <MapStage engine="${engine}"> needs the optional peer "${pkg}": install it.`,
			{ cause }
		);
	}
}

export interface DeckOverlay {
	/** A `MapboxOverlay` is also the map `IControl` that `addControl` takes. */
	setProps(props: { layers: unknown[] }): void;
	finalize(): void;
}

export async function loadDeckOverlay(layers: unknown[]): Promise<DeckOverlay> {
	try {
		const { MapboxOverlay } = await import("@deck.gl/mapbox");
		return new MapboxOverlay({
			interleaved: true,
			layers: layers as ConstructorParameters<typeof MapboxOverlay>[0]["layers"],
		}) as unknown as DeckOverlay;
	} catch (cause) {
		throw new Error(
			'[ca-ui] <MapStage layers> needs the optional peers "@deck.gl/core" and "@deck.gl/mapbox" (same ~9.4 minor): install them.',
			{ cause }
		);
	}
}
