// ─── Logo / image → brand ────────────────────────────────────────────────────
// Decodes the picked file in the browser, shrinks it to 96px and clusters the pixels with the
// lib's `extractPalette`. Nothing is uploaded; the preview is a small data URL kept in memory.

import { extractPalette, type PaletteColor, pickBrand } from "@codeatlasdev/ui/utils/color";

const MAX_BYTES = 8 * 1024 * 1024;
const SIDE = 96;

export interface ImageBrand {
	brand: string;
	palette: PaletteColor[];
	/** 96px PNG data URL for the UI. */
	preview: string;
}

/** Decode through `createImageBitmap`, falling back to an `<img>` (the path SVG always takes). */
async function decode(
	file: File
): Promise<{ source: CanvasImageSource; w: number; h: number; done: () => void } | null> {
	if (file.type !== "image/svg+xml" && typeof createImageBitmap === "function") {
		try {
			const bmp = await createImageBitmap(file);
			return { source: bmp, w: bmp.width, h: bmp.height, done: () => bmp.close() };
		} catch {
			// fall through to the <img> path
		}
	}
	const url = URL.createObjectURL(file);
	try {
		const img = new Image();
		img.decoding = "async";
		img.src = url;
		await img.decode();
		// SVG without intrinsic size reports 0: give it a square to rasterize into.
		const w = img.naturalWidth || SIDE;
		const h = img.naturalHeight || SIDE;
		return { source: img, w, h, done: () => URL.revokeObjectURL(url) };
	} catch {
		URL.revokeObjectURL(url);
		return null;
	}
}

export async function brandFromImage(file: File): Promise<ImageBrand | null> {
	if (!file.type.startsWith("image/") || file.size === 0 || file.size > MAX_BYTES) return null;
	const img = await decode(file);
	if (!img) return null;
	try {
		const scale = SIDE / Math.max(img.w, img.h);
		const w = Math.max(1, Math.round(img.w * scale));
		const h = Math.max(1, Math.round(img.h * scale));
		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return null;
		ctx.drawImage(img.source, 0, 0, w, h);
		const { data } = ctx.getImageData(0, 0, w, h);
		const palette = extractPalette(data, { k: 6 }).slice(0, 6);
		const best = pickBrand(palette);
		if (!best) return null;
		return { brand: best.hex, palette, preview: canvas.toDataURL("image/png") };
	} catch {
		return null;
	} finally {
		img.done();
	}
}
