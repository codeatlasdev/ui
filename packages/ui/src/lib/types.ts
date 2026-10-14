import type { Component } from "svelte";

/** Props the library passes to icon components. */
export type IconProps = {
	size?: number | string;
	class?: string;
	"stroke-width"?: number | string;
};

/**
 * Any Svelte 5 icon component accepting {@link IconProps}.
 * Structural, so `@lucide/svelte` icons (and compatible libraries) fit.
 */
export type IconComponent = Component<IconProps>;

/** Level of a rendered `<h2>`–`<h6>`. `<h1>` is reserved for the page title (`PageShell`). */
export type HeadingLevel = 2 | 3 | 4 | 5 | 6;
