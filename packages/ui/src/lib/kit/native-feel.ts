export interface NativeFeelOptions {
	/**
	 * Block page zoom (⌘/Ctrl +, -, 0 and pinch). Only for desktop shells (Tauri):
	 * on the web zoom is an accessibility feature. @default false
	 */
	blockZoom?: boolean;
	/** Keep the browser context menu for this event (e.g. debug builds). Editable fields always keep it. */
	allowContextMenu?: (e: MouseEvent) => boolean;
}

/**
 * Make an app shell behave like a native app instead of a web page:
 * - focus rings only while navigating with the keyboard (`html[data-kbd]`); WebKit
 *   treats programmatic focus (a dialog focusing its close button) as `:focus-visible`;
 * - no browser context menu and no text selection on chrome (buttons, nav, tabs),
 *   editable fields and `.ca-selectable` keep both;
 * - no dragging of links or images; optional zoom lock.
 * Sets `html[data-ca-native]`. Returns a cleanup function.
 */
export function nativeFeel({ blockZoom = false, allowContextMenu }: NativeFeelOptions = {}) {
	const root = document.documentElement;
	root.dataset.caNative = "";
	const keyboard = (e: KeyboardEvent) => {
		if (e.key === "Tab" || e.key.startsWith("Arrow")) root.dataset.kbd = "";
		if (blockZoom && (e.metaKey || e.ctrlKey) && ["=", "+", "-", "0"].includes(e.key))
			e.preventDefault();
	};
	const pointer = () => delete root.dataset.kbd;
	const menu = (e: MouseEvent) => {
		if (allowContextMenu?.(e)) return;
		const t = e.target instanceof Element ? e.target : null;
		if (!t?.closest("input, textarea, [contenteditable], .ca-selectable")) e.preventDefault();
	};
	const pinch = (e: WheelEvent) => {
		if (e.ctrlKey) e.preventDefault();
	};
	const drag = (e: DragEvent) => {
		if (e.target instanceof Element && e.target.closest("a, img")) e.preventDefault();
	};

	window.addEventListener("keydown", keyboard, true);
	window.addEventListener("pointerdown", pointer, true);
	window.addEventListener("contextmenu", menu);
	window.addEventListener("dragstart", drag);
	if (blockZoom) window.addEventListener("wheel", pinch, { passive: false });
	return () => {
		window.removeEventListener("keydown", keyboard, true);
		window.removeEventListener("pointerdown", pointer, true);
		window.removeEventListener("contextmenu", menu);
		window.removeEventListener("dragstart", drag);
		window.removeEventListener("wheel", pinch);
		delete root.dataset.caNative;
		delete root.dataset.kbd;
	};
}
