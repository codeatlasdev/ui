/** `[[west, south], [east, north]]` in lng/lat. */
export type MapBounds = [[number, number], [number, number]];

/** Pixels the map keeps clear on each side when fitting (UI that covers the stage). */
export interface MapPadding {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/** A style URL or an inline style object, for the light and dark scheme. */
export interface MapStyles<S = string | object> {
	light: S;
	dark: S;
}

/**
 * The map object of the engine in use (`maplibre-gl` `Map` or `mapbox-gl` `Map`). Both share the
 * methods this entry uses: `setStyle`, `jumpTo`, `flyTo`, `fitBounds`, `zoomIn`, `zoomOut`,
 * `resetNorth`, `getBearing`, `on`/`off`, `addControl`.
 */
export type MapInstance = import("maplibre-gl").Map;
