import type { Component } from "svelte";

// One lazy chunk per demo (and per `?raw` source): nothing is fetched until a card nears the
// viewport or the viewer opens that demo.
const components = import.meta.glob<{ default: Component }>("/src/demos/**/*.svelte");
const sources = import.meta.glob<string>("/src/demos/**/*.svelte", {
	query: "?raw",
	import: "default",
});

export const loadDemo = (path: string) => components[`/src/demos/${path}.svelte`]?.();
export const loadSource = (path: string) => sources[`/src/demos/${path}.svelte`]?.();
export const hasDemo = (path: string) => `/src/demos/${path}.svelte` in components;
