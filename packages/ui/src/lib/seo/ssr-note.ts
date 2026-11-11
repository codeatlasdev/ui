// #752: `@astrojs/svelte` renders a component to the page body only, so the `<svelte:head>` of
// `<Seo>` is dropped with no error. `<Seo>` cannot see that from inside, but the Astro middleware
// (`caUI`) sees the final HTML: `<Seo>` notes here that it rendered on the server, the middleware
// calls `checkSeoDropped` with the page and warns when the title never reached the document.
import { escapeHtml } from "./tags.js";

const rendered = new Set<string>();

/** `<Seo>` rendered on the server with this title. */
export function noteSeoRendered(title: string): void {
	rendered.add(title);
}

/** Drains the notes; returns the warning for the first `<Seo>` whose `<title>` is not in `html`, else `null`. */
export function checkSeoDropped(html: string): string | null {
	const titles = [...rendered];
	rendered.clear();
	const missing = titles.find((t) => !html.includes(`>${escapeHtml(t)}</title>`));
	if (missing === undefined) return null;
	return `<Seo> "${missing}" rendered in an Astro page, where <svelte:head> is dropped: no title, canonical or Open Graph tag reached the document. Put seoHead({ ...same props }) in <head> with <Fragment set:html={...} /> instead.`;
}
