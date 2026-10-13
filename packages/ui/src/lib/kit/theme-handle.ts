// ─── caThemeHandle — SvelteKit handle hook for FOUC prevention ───────────────
// Injects the theme init script (and brand preset styles) into every SSR or
// prerendered page via transformPageChunk. Works with every adapter because it
// runs inside SvelteKit's render pipeline, not Vite's transformIndexHtml.
//
//   import { sequence } from '@sveltejs/kit/hooks';
//   import { caThemeHandle } from '@codeatlasdev/ui/kit';
//
//   export const handle = sequence(
//     caThemeHandle({
//       presets: [{ id: 'brand', color: '#2563eb' }],
//       defaultPreset: 'brand',
//       defaultScheme: 'system',
//     }),
//   );

import type { sequence } from "@sveltejs/kit/hooks";
import { DEV } from "esm-env";
import { CA_THEME_MARKER, type ThemeOptions, themeHead } from "../theme-script.js";

// `Handle` lives in "@sveltejs/kit" on Kit 2 and in "@sveltejs/kit/hooks" on Kit 3;
// `sequence` is in "/hooks" on both, so derive the type from it.
/** SvelteKit `Handle`, derived once here so Kit 2 and Kit 3 both type-check. */
export type Handle = ReturnType<typeof sequence>;

/** Problems in the final HTML that break mobile layout or accessibility, warned once each in dev. */
const HEAD_CHECKS = [
	{
		missing: (html: string) => !/<meta[^>]+viewport-fit\s*=\s*cover/i.test(html),
		message:
			'the viewport meta has no "viewport-fit=cover", so the --ca-safe-* tokens stay 0 and content sits under the notch and home indicator. Use <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">.',
	},
	{
		missing: (html: string) =>
			/<meta[^>]+name=["']viewport["'][^>]*(user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b)/i.test(
				html
			),
		message:
			"the viewport meta blocks zoom (user-scalable=no or maximum-scale=1). Low-vision users must be able to zoom to 200% (WCAG 1.4.4); iOS input zoom is already prevented by the 16px input floor.",
	},
	{
		missing: (html: string) => !/<html(\s[^>]*)?\slang\s*=/i.test(html),
		message:
			'<html> has no lang attribute. Screen readers and search engines need it (WCAG 3.1.1). Set it in app.html, e.g. <html lang="en">.',
	},
];
const warned = new Set<number>();

/**
 * SvelteKit `Handle` that puts the theme head (brand presets + init script)
 * right after `<head>`, before any stylesheet or script, so the first paint
 * already has the right preset and scheme.
 *
 * Idempotent: skips pages that already contain the init script.
 */
export function caThemeHandle(options: ThemeOptions = {}): Handle {
	const head = themeHead(options);
	return ({ event, resolve }) =>
		resolve(event, {
			transformPageChunk: ({ html, done }) => {
				if (done && DEV)
					HEAD_CHECKS.forEach((check, i) => {
						if (warned.has(i) || !check.missing(html)) return;
						warned.add(i);
						console.warn(`[ca-ui] caThemeHandle: ${check.message}`);
					});
				if (!done || html.includes(CA_THEME_MARKER)) return html;
				return html.replace("<head>", `<head>${head}`);
			},
		});
}
