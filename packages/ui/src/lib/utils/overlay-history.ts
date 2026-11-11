import { dismissTopLayer, onLayerChange } from "../primitives/layer.js";

/**
 * Overlay history: the browser's Back (Android hardware Back, the iOS edge swipe, an installed
 * PWA's Back) closes the topmost modal layer instead of leaving the page.
 *
 * One history entry per open modal layer (Dialog, AlertDialog, Sheet, Drawer, MobilePane,
 * CommandPalette, Lightbox; a layer opts out with `history={false}`). Popovers, menus and hints
 * never enter history. Closing a layer by button, Escape or scrim consumes its entry, so the
 * history length is the same after open + close as before.
 *
 * Opt-in at app level: nothing happens until `bridgeOverlaysToHistory()` runs (SvelteKit mounts
 * `<OverlayHistory />` from `@codeatlasdev/ui/kit`; Astro and plain Vite call it once).
 */

/** What the bridge has to do to bring the history entries in line with the open layers. */
export function overlayStep(open: number, entries: number): "push" | "pop" | "idle" {
	return open > entries ? "push" : open < entries ? "pop" : "idle";
}

export interface OverlayHistoryAdapter {
	/** Adds one entry; `n` is how many overlay entries exist afterwards. */
	push(n: number): void | Promise<void>;
	/** True when the current entry is an overlay entry left over from before a reload, with no layer open. */
	isStaleEntry(): boolean;
}

interface OverlayState {
	caOverlays?: number;
}

const defaultAdapter: OverlayHistoryAdapter = {
	push: (n) => history.pushState({ ...history.state, caOverlays: n } satisfies OverlayState, ""),
	isStaleEntry: () => ((history.state as OverlayState | null)?.caOverlays ?? 0) > 0,
};

/** Returned by `bridgeOverlaysToHistory`: call it to stop the bridge. */
export interface OverlayBridge {
	(): void;
	/** History entries the bridge holds right now (one per open history layer). */
	entries(): number;
	/**
	 * Gives the entries back in one traversal without closing any layer, and resolves when the
	 * browser is on the entry under them. A router calls it before it navigates away from a page with
	 * open layers, so the new page does not sit on top of stale overlay entries.
	 */
	unwind(): Promise<void>;
}

/**
 * Keeps one history entry per open modal layer. Returns the function that stops it.
 * Pass an `adapter` to push through a router (SvelteKit's shallow routing) instead of `pushState`.
 */
export function bridgeOverlaysToHistory(
	adapter: OverlayHistoryAdapter = defaultAdapter
): OverlayBridge {
	if (typeof window === "undefined")
		return Object.assign(() => {}, { entries: () => 0, unwind: async () => {} });
	let open = 0;
	let entries = 0;
	/** `history.go` calls of ours whose `popstate` has not arrived yet. */
	let ownPops = 0;
	let waitPop: (() => void) | undefined;
	let running = false;
	let stopped = false;

	// A reload (or a restored tab) can leave an overlay entry under the current page with no layer
	// open: it must not reopen anything, and Back must not need two presses. Step out of it once.
	if (adapter.isStaleEntry()) {
		ownPops++;
		history.back();
	}

	async function step() {
		if (running) return;
		running = true;
		try {
			for (;;) {
				const action = overlayStep(open, entries);
				if (action === "idle" || stopped) break;
				if (action === "push") {
					entries++;
					await adapter.push(entries);
				} else {
					const back = entries - open;
					entries = open;
					ownPops++;
					const { promise, resolve } = Promise.withResolvers<void>();
					waitPop = resolve;
					history.go(-back);
					// `popstate` is async; if it never comes (nothing to go back to) do not hang the loop.
					const timer = setTimeout(onPopTimeout, 1000);
					await promise;
					clearTimeout(timer);
				}
			}
		} finally {
			running = false;
		}
	}

	const onPopTimeout = () => {
		if (ownPops > 0) ownPops--;
		const resolve = waitPop;
		waitPop = undefined;
		resolve?.();
	};

	const onPop = () => {
		if (ownPops > 0) {
			ownPops--;
			const resolve = waitPop;
			waitPop = undefined;
			resolve?.();
			return;
		}
		// The user pressed Back: that consumed one of our entries. Close the layer it stood for.
		if (entries > 0) entries--;
		dismissTopLayer();
	};

	const offLayers = onLayerChange(({ layers }) => {
		open = layers.filter((l) => l.kind === "modal" && l.history).length;
		void step();
	});
	window.addEventListener("popstate", onPop);

	const stop = () => {
		stopped = true;
		offLayers();
		window.removeEventListener("popstate", onPop);
	};
	return Object.assign(stop, {
		entries: () => entries,
		async unwind() {
			if (entries === 0) return;
			const { promise, resolve } = Promise.withResolvers<void>();
			const back = entries;
			entries = 0;
			ownPops++;
			waitPop = resolve;
			history.go(-back);
			const timer = setTimeout(onPopTimeout, 1000);
			await promise;
			clearTimeout(timer);
		},
	});
}
