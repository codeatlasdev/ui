import { modalBlocks, watchStack } from "../primitives/layer.js";

// ─── Layers store: is a modal open? ──────────────────────────────────────────
// Reactive view of the layer stack (`openLayer`: dialog, drawer, menu, popover, tooltip). Gate any
// hover- or edge-triggered UI of your own with it: a panel that opens under a modal is the bug.

function createLayersStore() {
	let version = $state(0);
	// The stack changes inside other components' effects (an attachment opens the layer): a write to
	// `$state` there would run in the middle of their update. Bump it after, in a microtask.
	watchStack(() => queueMicrotask(() => version++));
	return {
		/** A modal layer (dialog, drawer, sheet) is open, so the page behind it is inert. */
		get modalOpen() {
			void version; // subscribe: re-read when the layer stack changes
			return modalBlocks();
		},
		/**
		 * Whether hover/edge UI anchored at `trigger` must stay shut: a modal is open and `trigger` is
		 * not inside the topmost one. Without `trigger` it equals `modalOpen`.
		 */
		blocks(trigger?: Element | null) {
			void version; // subscribe: re-read when the layer stack changes
			return modalBlocks(trigger);
		},
	};
}

/** Reactive state of the layer stack. `layers.modalOpen` is true while a dialog, drawer or sheet is open; `layers.blocks(el)` is false for a trigger inside the topmost modal. */
export const layers = createLayersStore();
