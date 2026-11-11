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

/**
 * The app's own import of the engine, for example `() => import("mapbox-gl")`. The library cannot
 * name an optional peer for the bundler (apps without it would fail to build), and hiding the
 * import from Vite left a bare specifier in the client chunk that browsers cannot resolve (#712). A loader written
 * in the app is bundled by the app's bundler.
 */
export type EngineLoader = () => Promise<unknown>;

export async function loadEngine(
	engine: "maplibre" | "mapbox",
	load?: EngineLoader
): Promise<EngineModule> {
	const pkg = engine === "mapbox" ? "mapbox-gl" : "maplibre-gl";
	try {
		if (!load && engine === "mapbox") {
			throw new Error(
				`pass engineModule={() => import("mapbox-gl")} so your bundler includes the package`
			);
		}
		const mod = (await (load ? load() : import("maplibre-gl"))) as {
			default?: EngineModule;
		} & EngineModule;
		return mod.default ?? mod;
	} catch (cause) {
		throw new Error(
			`[ca-ui] <MapStage engine="${engine}"> needs the optional peer "${pkg}": install it` +
				(engine === "mapbox" ? ` and pass engineModule={() => import("mapbox-gl")}.` : "."),
			{ cause }
		);
	}
}

export interface DeckOverlay {
	/** A deck.gl overlay is also the map `IControl` that `addControl` takes. */
	setProps(props: { layers: unknown[] }): void;
	finalize(): void;
}

/**
 * `@deck.gl/mapbox` `MapboxOverlay` reads `map.transform.height`, which maplibre-gl 6 removed, so it
 * throws on every frame there (#470). `@deck.gl/maplibre` `MapLibreOverlay` is the overlay deck.gl
 * supports for maplibre-gl 4.5.1, 5 and 6; `MapboxOverlay` stays for mapbox-gl.
 */
export async function loadDeckOverlay(
	layers: unknown[],
	engine: "maplibre" | "mapbox" = "maplibre"
): Promise<DeckOverlay> {
	const pkg = engine === "mapbox" ? "@deck.gl/mapbox" : "@deck.gl/maplibre";
	try {
		const props = { interleaved: true, layers: layers as never };
		if (engine === "mapbox") {
			const { MapboxOverlay } = await import("@deck.gl/mapbox");
			return new MapboxOverlay(props) as unknown as DeckOverlay;
		}
		const { MapLibreOverlay } = await import("@deck.gl/maplibre");
		return new MapLibreOverlay(props) as unknown as DeckOverlay;
	} catch (cause) {
		throw new Error(
			`[ca-ui] <MapStage layers> needs the optional peers "@deck.gl/core" and "${pkg}" (same ~9.4 minor): install them.`,
			{ cause }
		);
	}
}
