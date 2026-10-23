import { getContext, setContext } from "svelte";
import type { MapInstance } from "./types.js";

const KEY = Symbol("ca-map");

/** Shared by `MapStage` with its children (`MapControls`). `map` is null until the engine has loaded. */
export interface MapContext {
	readonly map: MapInstance | null;
	/** `flyTo`, or `jumpTo` under `prefers-reduced-motion`. */
	move(options: Record<string, unknown>): void;
}

export function setMapContext(ctx: MapContext): void {
	setContext(KEY, ctx);
}

export function getMapContext(): MapContext {
	const ctx = getContext<MapContext | undefined>(KEY);
	if (!ctx) throw new Error("[ca-ui] <MapControls> must be rendered inside <MapStage>.");
	return ctx;
}
