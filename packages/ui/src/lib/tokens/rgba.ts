// ─── Token → RGBA for canvas/WebGL consumers (deck.gl, MapLibre paint, <canvas>) ─
// CSS tokens are `oklch()` / `color-mix()`, which WebGL cannot read. A 1×1 canvas resolves any color
// the browser understands to sRGB bytes. Results are cached per resolved CSS value, so a theme
// change needs no invalidation: the token resolves to a different string. No Svelte import: this
// file is part of `@codeatlasdev/ui/tokens`, which plain TypeScript, workers' main thread and
// Astro scripts import too.

import type { CaTokenName } from "../theme/preset-tokens.js";

/** `[r, g, b, a]`: r, g, b in 0-255, a in 0-1 (what `@deck.gl/core` `Color` expects, alpha scaled by the caller). */
export type Rgba = [number, number, number, number];

const cache = new Map<string, Rgba>();
let ctx: CanvasRenderingContext2D | null | undefined;

function canvasContext(): CanvasRenderingContext2D | null {
	if (ctx !== undefined) return ctx;
	if (typeof document === "undefined") {
		ctx = null;
		return ctx;
	}
	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	ctx = canvas.getContext("2d", { willReadFrequently: true });
	return ctx;
}

/** Draw `css` over an opaque `base` and read the pixel back (opaque result, so no premultiplied loss). */
function over(c: CanvasRenderingContext2D, css: string, base: string): Uint8ClampedArray {
	c.fillStyle = base;
	c.fillRect(0, 0, 1, 1);
	// An invalid color is ignored by fillStyle and would reuse the previous one: reset first.
	c.fillStyle = "#000";
	c.fillStyle = css;
	c.fillRect(0, 0, 1, 1);
	return c.getImageData(0, 0, 1, 1).data;
}

function resolve(css: string): Rgba {
	const hit = cache.get(css);
	if (hit) return hit;
	const c = canvasContext();
	let out: Rgba = [0, 0, 0, 0];
	if (c && css) {
		// A canvas stores premultiplied bytes, so reading a translucent color back loses precision
		// (50% white reads as 253,255,255). Drawn over opaque black and over opaque white the result
		// is exact: black gives c·a, white gives c·a + 255·(1-a), so a = 1 - (white - black)/255.
		const onBlack = over(c, css, "#000");
		const onWhite = over(c, css, "#fff");
		const a =
			1 -
			((onWhite[0] ?? 0) -
				(onBlack[0] ?? 0) +
				(onWhite[1] ?? 0) -
				(onBlack[1] ?? 0) +
				(onWhite[2] ?? 0) -
				(onBlack[2] ?? 0)) /
				(3 * 255);
		out =
			a < 0.004
				? [0, 0, 0, 0]
				: ([0, 1, 2]
						.map((i) => Math.min(255, Math.round((onBlack[i] ?? 0) / a)))
						.concat(Math.round(a * 100) / 100) as Rgba);
	}
	cache.set(css, out);
	return out;
}

/** `status.new` → `--ca-token-status-new`; a `--custom-property` or a CSS color passes through. */
function toCssValue(token: string): string {
	const t = token.trim();
	if (t.startsWith("--")) {
		return typeof document === "undefined"
			? ""
			: getComputedStyle(document.documentElement).getPropertyValue(t).trim();
	}
	if (/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/i.test(t))
		return toCssValue(`--ca-token-${t.replace(".", "-")}`.toLowerCase());
	return t;
}

/**
 * A design token (`--ca-brand-main`), a domain token by name (`"status.new"` for
 * `--ca-token-status-new`, also `"status.new-subtle"` / `"status.new-contrast"`) or any CSS color
 * (`#f59e0b`, `oklch(...)`, `color-mix(...)`) as `[r, g, b, a]`. `alpha` (0-1) multiplies the
 * color's own alpha. A token that is not declared is transparent black, and so is any call on the
 * server. Read it inside a `$derived`/`$effect` together with `colorScheme.resolved` (or subscribe
 * with `onTokensChange`) to follow scheme and preset changes.
 */
export function tokenRgba(token: CaTokenName | (string & {}), alpha = 1): Rgba {
	const [r, g, b, a] = resolve(toCssValue(token));
	return [r, g, b, Math.round(a * alpha * 100) / 100];
}

/**
 * Call `fn` after the scheme, preset or surface style of the page changes (the `class`,
 * `data-preset` and `data-style` attributes of `<html>`). Returns the unsubscribe function.
 * Server-side it does nothing. Svelte code usually reads `colorScheme` instead; this is for
 * canvas, map and chart code outside a component.
 */
export function onTokensChange(fn: () => void): () => void {
	if (typeof document === "undefined" || typeof MutationObserver === "undefined") return () => {};
	const observer = new MutationObserver(() => fn());
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class", "data-preset", "data-style"],
	});
	return () => observer.disconnect();
}
