// ─── PWA: web app manifest and Apple meta tags ───────────────────────────────

import { defineTheme, type ThemeDefinition } from "../theme/define.js";

export interface ManifestIcon {
	src: string;
	/** e.g. `"192x192"`. */
	sizes: string;
	/** @default "image/png" */
	type?: string;
	/** `"maskable"` icons must keep their content inside the central 80% safe zone. */
	purpose?: "any" | "maskable" | "monochrome";
}

export interface ManifestShortcut {
	name: string;
	url: string;
	short_name?: string;
	description?: string;
	icons?: ManifestIcon[];
}

export interface ManifestOptions {
	name: string;
	/** Label under the home screen icon. @default name */
	shortName?: string;
	description?: string;
	/** @default "/" */
	startUrl?: string;
	/** Navigation scope of the installed app. @default "/" */
	scope?: string;
	/** @default "standalone" */
	display?: "standalone" | "fullscreen" | "minimal-ui" | "browser";
	orientation?: "any" | "portrait" | "landscape";
	lang?: string;
	/** Include one `purpose: "maskable"` icon: Android crops others into a white tile. */
	icons: ManifestIcon[];
	shortcuts?: ManifestShortcut[];
	/**
	 * Theme definition used to derive `theme_color` and `background_color` from the
	 * default preset's surface (the same values the init script puts in `<meta name="theme-color">`).
	 */
	theme?: Partial<ThemeDefinition>;
	/** Overrides the derived colors, as `#rrggbb`. */
	themeColor?: string;
	backgroundColor?: string;
	/** Extra manifest members (`categories`, `screenshots`, `id`...). */
	extra?: Record<string, unknown>;
}

/**
 * Builds the web app manifest as an object. Serve it from a prerendered
 * `src/routes/manifest.webmanifest/+server.ts` with `JSON.stringify` and
 * `content-type: application/manifest+json`, and link it with `<Seo manifest>`
 * or `<link rel="manifest" href="/manifest.webmanifest">`.
 *
 * `theme_color` and `background_color` follow the theme's default scheme.
 */
export function manifest(o: ManifestOptions): Record<string, unknown> {
	if (!o.icons.some((i) => i.purpose === "maskable"))
		console.warn(
			"[ca-ui] manifest: no maskable icon; Android will letterbox the icon in a white tile"
		);
	const t = defineTheme(o.theme);
	const tc = t.themeColor[t.defaultPreset];
	const derived = t.defaultScheme === "light" ? tc.light : tc.dark;
	return {
		name: o.name,
		short_name: o.shortName ?? o.name,
		description: o.description,
		start_url: o.startUrl ?? "/",
		scope: o.scope ?? "/",
		display: o.display ?? "standalone",
		orientation: o.orientation,
		lang: o.lang,
		theme_color: o.themeColor ?? derived,
		background_color: o.backgroundColor ?? derived,
		icons: o.icons.map((i) => ({ type: "image/png", ...i })),
		shortcuts: o.shortcuts,
		...o.extra,
	};
}

export interface AppleMetaOptions {
	/** Absolute path to a 180x180 PNG without transparency (iOS fills it with black). */
	touchIcon: string;
	/** Title under the icon. */
	title?: string;
	/**
	 * `black-translucent` draws the page under the status bar (needs `viewport-fit=cover`
	 * and `--ca-safe-top` padding). @default "black-translucent"
	 */
	statusBarStyle?: "default" | "black" | "black-translucent";
}

/**
 * Markup for iOS home-screen apps, as an HTML string for `themeHead`-style injection
 * or `{@html}` inside `<svelte:head>`. Android and desktop read the manifest instead.
 */
export function appleMeta(o: AppleMetaOptions): string {
	const attr = (s: string) =>
		s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
	return [
		'<meta name="mobile-web-app-capable" content="yes" />',
		'<meta name="apple-mobile-web-app-capable" content="yes" />',
		`<meta name="apple-mobile-web-app-status-bar-style" content="${o.statusBarStyle ?? "black-translucent"}" />`,
		o.title ? `<meta name="apple-mobile-web-app-title" content="${attr(o.title)}" />` : "",
		`<link rel="apple-touch-icon" href="${attr(o.touchIcon)}" />`,
	]
		.filter(Boolean)
		.join("\n");
}
