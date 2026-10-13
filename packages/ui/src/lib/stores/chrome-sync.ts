// ─── chromeSync: browser chrome color follows what is actually painted ──────
// `<meta name="theme-color">` (Chrome/Samsung on Android, Safari ≤ 18, installed
// PWAs) colors the status bar. The init script sets it from the preset before
// first paint; once the app runs this keeps it equal to the opaque color under
// the top edge: an opaque MobileHeader, a theme island ([data-theme-scope]),
// or the page itself. Safari 26 ignores theme-color and samples the same edge
// elements directly, so both paths end up showing the same color.

let canvas: CanvasRenderingContext2D | null = null;
const hexCache = new Map<string, string>();

/** Any CSS color (oklch, color-mix results, rgb) → `#rrggbb`, via a 1px canvas. */
function toHex(color: string): string {
	const hit = hexCache.get(color);
	if (hit) return hit;
	canvas ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
	if (!canvas) return color;
	canvas.clearRect(0, 0, 1, 1);
	canvas.fillStyle = color;
	canvas.fillRect(0, 0, 1, 1);
	const [r, g, b] = canvas.getImageData(0, 0, 1, 1).data;
	const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
	hexCache.set(color, hex);
	return hex;
}

/** Fully opaque background of `el` or its nearest ancestor; html's color otherwise. */
function opaqueBackground(el: Element | null): string {
	for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
		const bg = getComputedStyle(n).backgroundColor;
		if (bg && bg !== "transparent" && !isTranslucent(bg)) return bg;
	}
	return getComputedStyle(document.documentElement).backgroundColor;
}

function isTranslucent(color: string): boolean {
	const m = color.match(/\/\s*([\d.]+%?)\s*\)$/) ?? color.match(/^rgba\([^)]*,\s*([\d.]+)\)$/);
	if (!m) return false;
	const a = m[1].endsWith("%") ? Number.parseFloat(m[1]) / 100 : Number.parseFloat(m[1]);
	return a < 0.99;
}

let teardown: (() => void) | undefined;
let frame = 0;
let fallback: ReturnType<typeof setTimeout> | undefined;

function sync() {
	cancelAnimationFrame(frame);
	clearTimeout(fallback);
	frame = 0;
	fallback = undefined;
	const top = document.elementFromPoint(window.innerWidth / 2, 1);
	const color = toHex(opaqueBackground(top));
	let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
	if (!meta) {
		meta = document.createElement("meta");
		meta.name = "theme-color";
		document.head.appendChild(meta);
	}
	if (meta.content !== color) meta.content = color;
}

/**
 * Re-sample on the next frame (coalesced). Browsers pause rAF for pages they treat as hidden
 * (background tabs, WebKit with several pages open), so a timeout runs it too; whichever
 * fires first wins. Without it one paused frame would block every later sync.
 */
export function scheduleChromeSync(): void {
	if (!teardown || frame || fallback) return;
	frame = requestAnimationFrame(sync);
	fallback = setTimeout(sync, 100);
}

/**
 * Start following the page. Started by `colorScheme.init()`; safe to call again.
 * Returns a cleanup function.
 */
export function startChromeSync(): () => void {
	if (teardown || typeof document === "undefined") return teardown ?? (() => {});
	const observer = new MutationObserver(scheduleChromeSync);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class", "data-preset", "data-style"],
	});
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["class", "data-theme-scope"],
	});
	// transitionend: a theme switch animates backgrounds; a sample taken mid-transition must be
	// redone once the color settles, or the bar keeps an in-between color.
	// visibilitychange: a tab coming back to the foreground re-samples (rAF was paused).
	const events = ["scroll", "resize", "pageshow", "transitionend", "visibilitychange"] as const;
	for (const e of events)
		window.addEventListener(e, scheduleChromeSync, { passive: true, capture: true });
	teardown = () => {
		observer.disconnect();
		for (const e of events) window.removeEventListener(e, scheduleChromeSync, { capture: true });
		cancelAnimationFrame(frame);
		clearTimeout(fallback);
		frame = 0;
		fallback = undefined;
		teardown = undefined;
	};
	scheduleChromeSync();
	return teardown;
}
