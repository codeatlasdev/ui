// ─── Open Graph images ───────────────────────────────────────────────────────
// Renders an HTML template at 1200x630 through a headless browser and serves the
// result from a SvelteKit `+server.ts`. Same approach as the analisa-ai SEO package:
// HTML/CSS is the template language (real fonts, gradients, `<img>`), and the browser
// is injected structurally, so this package depends on neither Playwright nor Puppeteer.
// Pass a Playwright `Browser` (from `chromium.launch()`); keep one alive per process.

/** Open Graph image size, 1200x630. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

interface PageLike {
	setContent: (html: string, options: { waitUntil: "load" }) => Promise<void>;
	evaluate: (script: string) => Promise<unknown>;
	screenshot: (options: {
		clip: { x: number; y: number; width: number; height: number };
		type: "jpeg" | "png";
		quality?: number;
	}) => Promise<Uint8Array>;
}

/** The subset of Playwright's `Browser` this module uses. */
export interface BrowserLike {
	newContext: (options: {
		deviceScaleFactor: number;
		viewport: { width: number; height: number };
	}) => Promise<{ newPage: () => Promise<PageLike>; close: () => Promise<void> }>;
}

/** Runs in the page: waits for web fonts and every `<img>` so a slow photo never yields a half-drawn card. */
const WAIT_FOR_ASSETS = `(async () => {
  await document.fonts.ready;
  await Promise.all(Array.from(document.images, (img) => img.complete ? undefined : img.decode().catch(() => undefined)));
})()`;

export interface RenderOgOptions {
	/** @default "jpeg" (smaller; use "png" for flat graphics with hard edges) */
	format?: "jpeg" | "png";
	/** JPEG quality 1-100. @default 82 */
	quality?: number;
}

/** Renders a complete HTML document at 1200x630 and returns the image bytes. */
export async function renderOgImage(
	browser: BrowserLike,
	html: string,
	{ format = "jpeg", quality = 82 }: RenderOgOptions = {}
): Promise<Uint8Array> {
	const context = await browser.newContext({ deviceScaleFactor: 1, viewport: OG_SIZE });
	try {
		const page = await context.newPage();
		await page.setContent(html, { waitUntil: "load" });
		await page.evaluate(WAIT_FOR_ASSETS);
		return await page.screenshot({
			clip: { x: 0, y: 0, ...OG_SIZE },
			type: format,
			quality: format === "jpeg" ? quality : undefined,
		});
	} finally {
		await context.close();
	}
}

export interface OgImageRouteOptions<E> extends RenderOgOptions {
	/** Returns the browser to render with. Called per request; keep the instance alive across calls. */
	browser: () => BrowserLike | Promise<BrowserLike>;
	/**
	 * Builds the HTML for this request (read `event.params` / `event.url`).
	 * Return `undefined` for an unknown page: the route answers 404.
	 */
	render: (event: E) => string | undefined | Promise<string | undefined>;
	/** Stable key for the rendered image, usually `event.url.pathname`. Enables the in-memory cache. */
	cacheKey?: (event: E) => string;
	/** Max cached images (oldest evicted first). @default 100 */
	cacheSize?: number;
	/** Concurrent renders; each costs a browser page. @default 2 */
	concurrency?: number;
	/** `Cache-Control` for the response. @default "public, max-age=3600, s-maxage=86400" */
	cacheControl?: string;
}

/**
 * Builds a SvelteKit `GET` handler for `src/routes/og/[slug].jpg/+server.ts`.
 * Renders are limited to `concurrency` at a time and cached by `cacheKey`.
 *
 * ```ts
 * export const GET = ogImageRoute({
 *   browser: getBrowser,
 *   render: ({ params }) => posts[params.slug] && ogTemplate(posts[params.slug]),
 *   cacheKey: ({ params }) => params.slug,
 * });
 * ```
 *
 * Fetch remote images inside the template as `data:` URLs so rendering needs no network.
 */
export function ogImageRoute<E = { params: Record<string, string>; url: URL }>(
	o: OgImageRouteOptions<E>
): (event: E) => Promise<Response> {
	const cache = new Map<string, Uint8Array>();
	const max = o.cacheSize ?? 100;
	const limit = o.concurrency ?? 2;
	let active = 0;
	const waiters: (() => void)[] = [];
	const type = o.format === "png" ? "image/png" : "image/jpeg";

	return async (event) => {
		const key = o.cacheKey?.(event);
		let bytes = key === undefined ? undefined : cache.get(key);
		if (!bytes) {
			const html = await o.render(event);
			if (html === undefined) return new Response("Not found", { status: 404 });
			if (active >= limit) await new Promise<void>((r) => waiters.push(r));
			active += 1;
			try {
				bytes = await renderOgImage(await o.browser(), html, o);
			} finally {
				active -= 1;
				waiters.shift()?.();
			}
			if (key !== undefined) {
				if (cache.size >= max) cache.delete(cache.keys().next().value as string);
				cache.set(key, bytes);
			}
		}
		return new Response(bytes as BodyInit, {
			headers: {
				"content-type": type,
				"cache-control": o.cacheControl ?? "public, max-age=3600, s-maxage=86400",
			},
		});
	};
}

// ─── Social card template ────────────────────────────────────────────────────

export interface OgCardOptions {
	title: string;
	description?: string;
	/** Small label above the title, e.g. the docs group. */
	eyebrow?: string;
	/** Site name next to the mark. */
	siteName: string;
	/** Mark SVG with colors already filled (`renderMark` from `@codeatlasdev/ui/vite`). */
	mark: string;
	/** Literal `#rrggbb` colors, usually `resolveBrand(theme).dark` (`ink`, `spark`, `surface`). */
	colors: { ink: string; spark: string; surface: string };
	/**
	 * Extra CSS for the document, typically `@font-face` rules or the app's stylesheet text.
	 * Fonts must be embedded (`data:` URLs) for renders to match across machines.
	 */
	css?: string;
	/** `font-family` stack. @default system sans-serif */
	fontFamily?: string;
}

const esc = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Complete 1200x630 HTML document for a social card. Feed it to `renderOgImage` (or return it from
 * `ogImageRoute({ render })`). Colors are literal hex, so the card renders without the app's CSS.
 */
export function ogCard(o: OgCardOptions): string {
	const font = o.fontFamily ?? "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${o.css ?? ""}
*{box-sizing:border-box;margin:0}
body{width:${OG_SIZE.width}px;height:${OG_SIZE.height}px;overflow:hidden;background:radial-gradient(900px 520px at 100% 0%,color-mix(in srgb,${o.colors.spark} 22%,transparent),transparent 70%),${o.colors.surface};color:${o.colors.ink};font-family:${font};display:flex;flex-direction:column;justify-content:space-between;padding:72px 80px;border-left:16px solid ${o.colors.spark}}
.brand{display:flex;align-items:center;gap:24px;font-size:36px;font-weight:600}
.brand svg{width:88px;height:88px}
.eyebrow{font-size:28px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${o.colors.spark};margin-bottom:20px}
h1{font-size:76px;line-height:1.08;font-weight:700;letter-spacing:-.02em;max-width:1000px;overflow-wrap:anywhere}
p{font-size:34px;line-height:1.35;margin-top:24px;max-width:960px;opacity:.78;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
</style></head><body>
<div class="brand">${o.mark}<span>${esc(o.siteName)}</span></div>
<div>${o.eyebrow ? `<div class="eyebrow">${esc(o.eyebrow)}</div>` : ""}<h1>${esc(o.title)}</h1>${o.description ? `<p>${esc(o.description)}</p>` : ""}</div>
</body></html>`;
}
