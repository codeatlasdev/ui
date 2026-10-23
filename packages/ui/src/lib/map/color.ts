// ─── Token → RGBA for canvas/WebGL consumers (deck.gl, MapLibre paint) ───────
// CSS tokens are `oklch()` / `color-mix()`, which WebGL cannot read. A 1×1 canvas resolves any
// color the browser understands to sRGB bytes. Results are cached per resolved CSS value, so a
// theme change needs no manual invalidation: the token resolves to a different string.

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

function resolve(css: string): Rgba {
	const hit = cache.get(css);
	if (hit) return hit;
	const c = canvasContext();
	let out: Rgba = [0, 0, 0, 0];
	if (c && css) {
		c.clearRect(0, 0, 1, 1);
		// An invalid color is ignored by fillStyle and would reuse the previous one: reset first.
		c.fillStyle = "#000";
		c.fillStyle = css;
		c.fillRect(0, 0, 1, 1);
		const [r = 0, g = 0, b = 0, a = 0] = c.getImageData(0, 0, 1, 1).data;
		// Canvas stores premultiplied-then-unpremultiplied bytes, so a translucent color loses precision.
		out = [r, g, b, Math.round((a / 255) * 100) / 100];
	}
	cache.set(css, out);
	return out;
}

/**
 * A design token (`--ca-brand-main`) or any CSS color (`#f59e0b`, `oklch(...)`, `color-mix(...)`) as
 * `[r, g, b, a]` for deck.gl and map paint properties. `alpha` (0-1) multiplies the color's own
 * alpha. An unset token is transparent black. Server-side it returns transparent black too.
 */
export function tokenColor(token: string, alpha = 1): Rgba {
	let css = token.trim();
	if (css.startsWith("--")) {
		css =
			typeof document === "undefined"
				? ""
				: getComputedStyle(document.documentElement).getPropertyValue(css).trim();
	}
	const [r, g, b, a] = resolve(css);
	return [r, g, b, Math.round(a * alpha * 100) / 100];
}

/** `[r, g, b, a]` as a CSS `rgba()` string, for MapLibre/Mapbox paint properties. */
export function rgbaCss([r, g, b, a]: Rgba): string {
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}
