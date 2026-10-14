// ─── Viewport store: on-screen keyboard inset ────────────────────────────────
// keyboardInset = how much of the layout viewport the virtual keyboard covers.
// Computed from visualViewport against documentElement.clientHeight, never
// window.innerHeight: on iOS innerHeight changes with the URL bar, which would
// read as a phantom keyboard. Mirrored to --ca-kb-inset on <html>.

/** Deltas below this are browser chrome (URL bar, toolbars), not a keyboard. */
const MIN_KEYBOARD = 80;

function createViewportStore() {
	let keyboardInset = $state(0);
	let teardown: (() => void) | undefined;

	/** Starts tracking (attaches once). Returns cleanup. */
	function init(): () => void {
		const vv = typeof window === "undefined" ? undefined : window.visualViewport;
		if (!vv) return () => {};
		if (teardown) return teardown;
		const html = document.documentElement;
		let frame = 0;
		const measure = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				// Pinch-zoom shrinks the visual viewport too: that is not a keyboard.
				if (vv.scale > 1.01) return;
				const covered = Math.max(0, html.clientHeight - vv.height - vv.offsetTop);
				const next = covered < MIN_KEYBOARD ? 0 : Math.round(covered);
				if (next === keyboardInset) return;
				keyboardInset = next;
				html.style.setProperty("--ca-kb-inset", `${next}px`);
			});
		};
		vv.addEventListener("resize", measure);
		vv.addEventListener("scroll", measure);
		measure();
		teardown = () => {
			cancelAnimationFrame(frame);
			vv.removeEventListener("resize", measure);
			vv.removeEventListener("scroll", measure);
			html.style.removeProperty("--ca-kb-inset");
			keyboardInset = 0;
			teardown = undefined;
		};
		return teardown;
	}

	return {
		/** Pixels of the layout viewport covered by the on-screen keyboard (0 when closed). */
		get keyboardInset() {
			return keyboardInset;
		},
		init,
	};
}

/** On-screen keyboard tracker: `viewport.keyboardInset` is the layout-viewport height the virtual keyboard covers, mirrored to `--ca-kb-inset` on `<html>`. Call `viewport.init()` once; it returns a cleanup. */
export const viewport = createViewportStore();
