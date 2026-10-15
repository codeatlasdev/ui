// Static `src/error.html` for SvelteKit, generated from the app's theme and locale.
// Plain TypeScript (no runes, no `.svelte`): `caErrorPlugin` runs it in Node from vite.config.

import { getMessages, type Locale } from "../i18n/catalog.js";
import { defaultPresetTokens, defineTheme } from "../theme/define.js";
import { type ThemeOptions, themeHead } from "../theme-script.js";
import { cssBlock } from "../utils/palette-generator.js";

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Tokens the page reads. They are re-declared from the theme's default preset: the static page loads no stylesheet. */
const TOKENS = [
	"--ca-surface-base",
	"--ca-text-primary",
	"--ca-text-secondary",
	"--ca-outline-default",
	"--ca-brand-main",
	"--ca-brand-fill",
	"--ca-brand-contrast",
] as const;

const pick = (m: Record<string, string>) =>
	Object.fromEntries(TOKENS.map((k) => [k, m[k]])) as Record<string, string>;

const CSS = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html {
	background: radial-gradient(ellipse 80% 60% at 0% 0%,
		color-mix(in oklch, var(--ca-brand-main) 18%, transparent) 0%, transparent 60%),
		var(--ca-surface-base);
	background-attachment: fixed;
	min-height: 100vh;
	min-height: 100svh;
	font-family: system-ui, -apple-system, sans-serif;
	color: var(--ca-text-primary);
}
body {
	min-height: 100vh;
	min-height: 100svh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
}
.card {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 16px;
	max-width: 480px;
}
.bubble {
	width: 72px;
	height: 72px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: color-mix(in oklch, var(--ca-brand-main) 12%, transparent);
	border: 1px solid color-mix(in oklch, var(--ca-brand-main) 25%, transparent);
	color: var(--ca-brand-main);
	font-size: 28px;
	margin-bottom: 8px;
}
.status {
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--ca-brand-main);
}
h1 {
	font-size: clamp(1.5rem, 4vw, 2.25rem);
	font-weight: 700;
	letter-spacing: -0.025em;
	line-height: 1.15;
}
p {
	font-size: 1rem;
	color: var(--ca-text-secondary);
	line-height: 1.6;
	max-width: 360px;
}
.actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
a {
	display: inline-flex;
	align-items: center;
	padding: 8px 20px;
	border-radius: 8px;
	text-decoration: none;
	font-size: 14px;
	font-weight: 500;
	background: var(--ca-brand-fill);
	color: var(--ca-brand-contrast);
}
a:hover { opacity: 0.85; }
a:focus-visible { outline: 2px solid var(--ca-text-primary); outline-offset: 2px; }`;

export interface ErrorHtmlOptions {
	/** Same object as `caThemePlugin(theme)`: preset, scheme, brand presets. */
	theme?: ThemeOptions;
	/** `lang` of the document and language of the built-in copy. `en` and `pt-BR` are built in. @default "en" */
	locale?: Locale;
}

/**
 * The `src/error.html` that `caErrorPlugin({ scaffold: true })` writes. SvelteKit replaces
 * `%sveltekit.status%` and `%sveltekit.error.message%` at runtime. The theme init script sits in
 * `<head>` (before paint) and the page has no `javascript:` URL: it works under a strict CSP that
 * allows the one inline script by hash or nonce, and without it the page still renders.
 */
export function errorHtml(options: ErrorHtmlOptions = {}): string {
	const { theme = {}, locale = "en" } = options;
	const t = defineTheme(theme);
	const tokens = defaultPresetTokens(t);
	const m = getMessages(locale).errorPage;
	const vars = `${cssBlock(":root", pick(tokens.light))}\n${cssBlock("html.dark", pick(tokens.dark))}`;
	// themeHead carries brand-preset CSS + the init script; the page's own <style> follows it.
	const head = themeHead(theme);
	return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-preset="${escapeHtml(t.defaultPreset)}">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<title>%sveltekit.status% · ${escapeHtml(m.fallbackTitle)}</title>
	${head}
	<style>
${vars}
${CSS}
	</style>
</head>
<body>
	<div class="card">
		<div class="bubble" aria-hidden="true">⚠</div>
		<p class="status">%sveltekit.status%</p>
		<h1>${escapeHtml(m.fallbackTitle)}</h1>
		<p>%sveltekit.error.message%</p>
		<div class="actions">
			<a href="/">${escapeHtml(m.home)}</a>
		</div>
	</div>
</body>
</html>
`;
}
