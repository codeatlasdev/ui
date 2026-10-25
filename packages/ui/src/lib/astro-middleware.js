// Astro middleware registered by `caUI` (see astro.ts): puts the integration's head markup FIRST in
// `<head>` of every HTML page, after Astro has rendered it. `injectScript("head-inline")` cannot: Astro
// renders every bundled `<style>` (hundreds of KB with `inlineStylesheets: "always"`) before it, so the
// theme script would run only after that CSS was parsed, and a slow link paints the wrong theme in
// between. Runs for prerendered pages at build time and for SSR/dev requests alike.
import head from "virtual:codeatlas-ui/head";
import { headFirst } from "./head-first.js";

/** @type {import("astro").MiddlewareHandler} */
export const onRequest = async (_context, next) => {
	const response = await next();
	if (!response.headers.get("content-type")?.includes("text/html")) return response;
	return new Response(headFirst(await response.text(), head), response);
};
