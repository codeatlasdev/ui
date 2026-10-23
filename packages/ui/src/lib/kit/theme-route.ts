// ─── Per-route theme for caThemeHandle ──────────────────────────────────────────
// A route that is a full-page theme island (a light "paper" landing inside a dark app) must reach
// the browser with its preset and scheme already on <html>, or the first paint flashes the app theme.
// Hooks cannot read a route module's exports, so the route declares it in `load`, which shares the
// request's `event.locals` with the hook, or the app lists route groups once in `caThemeHandle`.

import type { IslandTheme } from "../theme/island.js";

export type { IslandTheme } from "../theme/island.js";

/** Route id prefixes (`event.route.id`, e.g. `"/(marketing)"`) → the theme their pages use. Longest prefix wins. */
export type RouteThemes = Record<string, Partial<IslandTheme>>;

/** Options of the second argument of `caThemeHandle`. */
export interface ThemeHandleOptions {
	/** Full-page themes by route id prefix, for whole route groups. `setRouteTheme` in `load` overrides it. */
	routes?: RouteThemes;
}

/** Where `setRouteTheme` leaves the theme on `event.locals`; read by `caThemeHandle`. */
const KEY = "__caRouteTheme";

interface EventLike {
	locals?: object;
	route?: { id?: string | null };
}

/**
 * Declare the full-page theme of the route being loaded. Call it in `+page.server.ts` or
 * `+layout.server.ts` `load`; `caThemeHandle` writes it on `<html>` (preset, `data-theme-scope`, `dark`
 * class) in the server response, so the first paint already has it. Pair it with `<ThemeIsland document>`
 * in the page so client navigation applies and restores the same values.
 */
export function setRouteTheme(event: { locals: object }, theme: IslandTheme): void {
	(event.locals as Record<string, unknown>)[KEY] = theme;
}

/** Theme for this request: `setRouteTheme` first, then the longest matching `routes` prefix. */
export function resolveRouteTheme(
	event: EventLike,
	routes: RouteThemes | undefined
): Partial<IslandTheme> | undefined {
	const declared = (event.locals as Record<string, unknown> | undefined)?.[KEY];
	if (declared) return declared as IslandTheme;
	const id = event.route?.id;
	if (!routes || !id) return undefined;
	const prefix = Object.keys(routes)
		.filter((p) => id === p || id.startsWith(`${p}/`))
		.sort((a, b) => b.length - a.length)[0];
	return prefix === undefined ? undefined : routes[prefix];
}

const HTML_TAG = /<html(\s[^>]*)?>/i;

/**
 * `html` with the island's attributes on its opening `<html>` tag: `data-preset`, `data-theme-scope`,
 * `data-ca-island` (tells the init script to leave them alone) and the `dark` class merged into any
 * `class` the app already set. Any other attribute (`lang`, `dir`) is kept as is.
 */
export function applyRouteTheme(
	html: string,
	theme: Partial<IslandTheme>,
	known: string[]
): string {
	if (theme.preset !== undefined && !known.includes(theme.preset))
		throw new Error(
			`[codeatlasdev/ui] route theme preset "${theme.preset}" is not a known preset (known: ${known.join(", ")})`
		);
	const scheme = theme.scheme;
	return html.replace(HTML_TAG, (_tag, attrs: string | undefined) => {
		let rest = (attrs ?? "").replace(
			/\s(data-preset|data-theme-scope|data-ca-island)(=("[^"]*"|'[^']*'|[^\s>]*))?/gi,
			""
		);
		const dark = scheme === "dark";
		const cls = /\sclass=("([^"]*)"|'([^']*)')/i;
		rest = cls.test(rest)
			? rest.replace(cls, (_m, _q, d: string | undefined, sq: string | undefined) => {
					const names = (d ?? sq ?? "").split(/\s+/).filter((c) => c && c !== "dark");
					if (dark) names.push("dark");
					return names.length ? ` class="${names.join(" ")}"` : "";
				})
			: dark
				? `${rest} class="dark"`
				: rest;
		const added = [
			theme.preset !== undefined ? ` data-preset="${theme.preset}"` : "",
			scheme ? ` data-theme-scope="${scheme}"` : "",
			" data-ca-island",
		].join("");
		return `<html${rest}${added}>`;
	});
}
