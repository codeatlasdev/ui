/** Asset URLs `iconLinks` links to. A subset of what `generateBrand` returns (`BrandAssets`). */
export interface IconLinksInput {
	/** SVG favicon (follows `prefers-color-scheme`). */
	favicon: string;
	/** ICO fallback for browsers that ignore SVG favicons. */
	ico?: string;
	/** 180x180 opaque PNG for the iOS home screen. */
	appleTouch?: string;
	/** Web app manifest URL. */
	manifest?: string;
}

const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Head markup for the icon set, as an HTML string for `{@html}` in `<svelte:head>` or `set:html`
 * in Astro. Pair it with `generateBrand` / `caBrandPlugin` from `@codeatlasdev/ui/vite`:
 * `iconLinks(brand)`.
 */
export function iconLinks(a: IconLinksInput): string {
	return [
		`<link rel="icon" href="${attr(a.favicon)}" type="image/svg+xml" />`,
		a.ico ? `<link rel="icon" href="${attr(a.ico)}" sizes="48x48" />` : "",
		a.appleTouch ? `<link rel="apple-touch-icon" href="${attr(a.appleTouch)}" />` : "",
		a.manifest ? `<link rel="manifest" href="${attr(a.manifest)}" />` : "",
	]
		.filter(Boolean)
		.join("\n");
}
