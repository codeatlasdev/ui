// ─── color-mix() and alpha compositing, for the build-time contrast check ──────
// Only the contrast warning needs these, so they live apart from `css-color.ts`: validating a role
// color is on the runtime path of `defineTheme` (seo/pwa.ts imports it), evaluation is not.

import { clamp01, oklabToRgb, type ParsedColor, parseCssColor, splitTop } from "./css-color.js";

const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

function rgbToOklab([r, g, b]: [number, number, number]): [number, number, number] {
	const [R, G, B] = [decode(r), decode(g), decode(b)];
	const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
	const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
	const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
}

/**
 * `color-mix(in oklab|srgb, A [p%], B [q%])`, per CSS Color 5: percentages default to the
 * complement (50/50 when both are omitted); over 100% they are normalized, under 100% the result's
 * alpha is scaled by their sum; components interpolate premultiplied by alpha.
 */
function colorMix(t: string): ParsedColor | null {
	const m = /^color-mix\((.*)\)$/is.exec(t);
	if (!m) return null;
	const [space, ...stops] = splitTop(m[1]);
	const model = /^in\s+(oklab|srgb)$/i.exec(space ?? "")?.[1]?.toLowerCase();
	if (!model || stops.length !== 2) return null;
	const [a, b] = stops.map((s) => {
		const pm = /^(.*?)(?:\s+(\d*\.?\d+)%)?$/s.exec(s);
		return {
			color: pm ? evalColor(pm[1].trim()) : null,
			pct: pm?.[2] === undefined ? undefined : Number.parseFloat(pm[2]),
		};
	});
	if (!a?.color || !b?.color) return null;
	const pa = a.pct ?? (b.pct === undefined ? 50 : 100 - b.pct);
	const pb = b.pct ?? 100 - pa;
	const sum = pa + pb;
	if (sum <= 0) return null;
	const norm = sum > 100 ? sum : 100;
	const [fa, fb] = [pa / norm, pb / norm];
	const alpha = clamp01(a.color.alpha * fa + b.color.alpha * fb);
	if (alpha === 0) return { rgb: [0, 0, 0], alpha: 0 };
	const [wa, wb] = [(a.color.alpha * fa) / alpha, (b.color.alpha * fb) / alpha];
	const mix = (x: number[], y: number[]) => x.map((v, i) => v * wa + (y[i] ?? 0) * wb);
	if (model === "srgb") return { rgb: mix(a.color.rgb, b.color.rgb) as ParsedColor["rgb"], alpha };
	const [L = 0, A = 0, B = 0] = mix(rgbToOklab(a.color.rgb), rgbToOklab(b.color.rgb));
	return { rgb: oklabToRgb(L, A, B), alpha };
}

/** `parseCssColor` that also evaluates `color-mix()`. */
export function evalColor(color: string): ParsedColor | null {
	return parseCssColor(color, colorMix);
}

/** Composite `fg` over an opaque `bg` the way a browser does (in encoded sRGB). */
export function compositeOver(fg: ParsedColor, bg: ParsedColor["rgb"]): ParsedColor["rgb"] {
	return fg.rgb.map((v, i) => v * fg.alpha + (bg[i] ?? 0) * (1 - fg.alpha)) as ParsedColor["rgb"];
}
