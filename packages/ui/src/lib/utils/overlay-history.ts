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
	/** `history.go` calls of ours whose `popstate` has not arrived yet (no Navigation API, or the stale step-out). */
	let ownPops = 0;
	let waitPop: (() => void) | undefined;
	let running = false;
	let stopped = false;
	// Navigation API: `keys[0]` is the page's own entry, `keys[k]` the entry after the k-th push. A close
	// traverses to an absolute key, so a user Back racing it can never make it overshoot (#858).
	const nav = window.navigation;
	const keys: string[] = [];
	const currentKey = () => nav?.currentEntry?.key ?? "";
	/** Overlay entries between the page's own entry and where the browser is now; undefined when off our stack. */
	const depthNow = () => {
		const at = keys.indexOf(currentKey());
		return at < 0 ? undefined : at;
	};

	// A reload (or a restored tab) can leave an overlay entry under the current page with no layer
	// open: it must not reopen anything, and Back must not need two presses. Step out of it once.
	if (adapter.isStaleEntry()) {
		ownPops++;
		history.back();
	}

	/** Brings the browser to `target` and `entries` in line with where it ended up; a no-op when the user's Back already got there. */
	async function traverseTo(target: string) {
		if (currentKey() !== target) {
			try {
				await nav.traverseTo(target).finished;
			} catch {
				// Superseded (the user's Back, a link): where the browser is now is read below.
			}
		}
		entries = Math.min(depthNow() ?? open, entries);
	}

	async function step() {
		if (running) return;
		running = true;
		try {
			for (;;) {
				const action = overlayStep(open, entries);
				if (action === "idle" || stopped) break;
				if (action === "push") {
					if (nav && entries === 0) keys[0] = currentKey();
					entries++;
					await adapter.push(entries);
					if (nav) keys[entries] = currentKey();
				} else if (nav && keys[open] !== undefined) {
					await traverseTo(keys[open]);
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
		// Navigation API: where the browser is now says how many entries remain, whoever moved it, so our
		// own traversal and a racing user Back both land on the same count.
		const depth = depthNow();
		// The user pressed Back. When a layer was already closed and its entry not yet given back
		// (`entries > open`), this Back is that close's traversal: it consumes the entry and the page
		// stays (#858). Otherwise it consumed the entry of a layer that is still open: close it.
		if (entries > open) {
			entries = depth ?? entries - 1;
			return;
		}
		entries = depth ?? Math.max(entries - 1, 0);
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
