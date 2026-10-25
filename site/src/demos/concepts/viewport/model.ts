// The arithmetic behind the viewport concept's demos. An illustrative model, not a browser: it shows how the
// four viewport units, the safe-area insets and a virtual keyboard relate, with numbers the reader can change.
// Real browsers differ (bar heights, keyboard resize modes), so the concept page tells people to test devices.

export interface DeviceModel {
	/** Screen height in CSS px with no browser UI. */
	screen: number;
	/** Height of the browser's collapsible top and bottom bars together when they are shown. */
	bars: number;
	/** Safe-area insets in CSS px (notch or island, home indicator). */
	safe: { top: number; bottom: number };
	/** Height of the virtual keyboard in CSS px; 0 when closed. */
	keyboard: number;
	/** Whether the bars are currently collapsed (the user scrolled). */
	collapsed: boolean;
	/** How the browser reacts to the keyboard: shrink the layout viewport or only the visual one. */
	keyboardMode: "resizes-content" | "resizes-visual";
}

export interface ViewportHeights {
	/** `100lvh`: the large viewport, bars collapsed. `100vh` equals it. */
	lvh: number;
	/** `100svh`: the small viewport, bars shown. */
	svh: number;
	/** `100dvh`: follows the bars as they show and hide. */
	dvh: number;
	/** Height of the visual viewport the person can actually see right now. */
	visible: number;
	/** Pixels of the layout viewport covered by the keyboard (what `viewport.keyboardInset` reports). */
	keyboardInset: number;
	/** What is left for content: the visible height minus the safe areas the page asked to respect. */
	usable: number;
}

/** The heights the four units resolve to for one device state. Pure and total: inputs are clamped to sane ranges. */
export function viewportHeights(d: DeviceModel): ViewportHeights {
	const screen = Math.max(0, d.screen);
	const bars = Math.min(Math.max(0, d.bars), screen);
	const kb = Math.min(Math.max(0, d.keyboard), screen);
	const lvh = screen;
	const svh = screen - bars;
	const dvh = d.collapsed ? lvh : svh;
	// With `resizes-content` the layout viewport shrinks; with `resizes-visual` only the visual one does.
	const visible = Math.max(0, dvh - kb);
	const keyboardInset = d.keyboardMode === "resizes-visual" ? kb : 0;
	const safe = Math.max(0, d.safe.top) + (kb > 0 ? 0 : Math.max(0, d.safe.bottom));
	return { lvh, svh, dvh, visible, keyboardInset, usable: Math.max(0, visible - safe) };
}

/** Whether a `100<unit>` block overflows what is visible (its bottom edge is hidden under browser UI or the keyboard). */
export function hiddenBy(unit: "lvh" | "svh" | "dvh", d: DeviceModel): number {
	const h = viewportHeights(d);
	return Math.max(0, h[unit] - h.visible);
}

/** Presets: common shapes as test samples, not a distribution of devices. */
export const DEVICE_PRESETS = {
	"Narrow phone (320 x 640)": { width: 320, screen: 640, bars: 112, safe: { top: 0, bottom: 0 } },
	"Typical phone (390 x 844)": {
		width: 390,
		screen: 844,
		bars: 110,
		safe: { top: 47, bottom: 34 },
	},
	"Short phone (360 x 568)": { width: 360, screen: 568, bars: 100, safe: { top: 0, bottom: 0 } },
	"Phone in landscape (844 x 390)": {
		width: 844,
		screen: 390,
		bars: 60,
		safe: { top: 0, bottom: 21 },
	},
} as const;
export type PresetName = keyof typeof DEVICE_PRESETS;
