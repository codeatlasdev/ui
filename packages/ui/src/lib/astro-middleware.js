// Astro middleware registered by `caUI` (see astro.ts): puts the integration's head markup FIRST in
// `<head>` of every HTML page, after Astro has rendered it. `injectScript("head-inline")` cannot: Astro
// renders every bundled `<style>` (hundreds of KB with `inlineStylesheets: "always"`) before it, so the
// theme script would run only after that CSS was parsed, and a slow link paints the wrong theme in
// between. Runs for prerendered pages at build time and for SSR/dev requests alike.
import head, { defaults } from "virtual:codeatlas-ui/head";
import { headFirst } from "./head-first.js";
import { checkSeoDropped } from "./seo/ssr-note.js";
import { setThemeDefaults } from "./stores/theme-defaults.js";

// The server-side `colorScheme` starts from the app's theme (#729).
setThemeDefaults(defaults);

/** @type {import("astro").MiddlewareHandler} */
export const onRequest = async (_context, next) => {
	const response = await next();
	if (!response.headers.get("content-type")?.includes("text/html")) return response;
	const html = await response.text();
	// Dev only (`<Seo>` notes itself only there): `<svelte:head>` is dropped in Astro (#752).
	const dropped = checkSeoDropped(html);
	if (dropped) console.warn(`[ca-ui] ${dropped}`);
	return new Response(headFirst(html, head), response);
};
