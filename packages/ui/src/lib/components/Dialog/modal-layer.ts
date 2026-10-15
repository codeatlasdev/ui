import { type LayerDismissReason, openLayer } from "../../primitives/index.js";

export interface ModalLayerOptions {
	/** Called for Escape (`cancel`) and, unless `outside` is false, for a click on the scrim. */
	onDismiss(reason: "escape" | "outside"): void;
	/** Dismiss on scrim click. Default true. */
	outside?: boolean;
	/** Where focus lands on open. `'first'` (default) = native (first tabbable), `'container'` = the dialog itself, an element, or `false` to let the caller focus. */
	initial?: "first" | "container" | HTMLElement | false;
	/** Called after the layer is shown and focus is placed (for consumers that focus a field). */
	onOpen?(dialog: HTMLDialogElement): void;
}

/**
 * Attachment for a modal overlay whose panel IS a native `<dialog>` (Dialog, Sheet, Drawer, …):
 * the layer engine's `modal` kind bound to the element's lifetime. The options are read through a
 * getter so callbacks always see the latest props.
 *
 *   <dialog class="ca-dialog" {@attach modalLayer(() => ({ onDismiss }))}>…</dialog>
 */
export function modalLayer(options: () => ModalLayerOptions) {
	return (dialog: HTMLElement): (() => void) => {
		if (!(dialog instanceof HTMLDialogElement)) return () => {};
		const { initial, onOpen } = options();
		const layer = openLayer(dialog, {
			kind: "modal",
			initialFocus: initial,
			onOpen: () => onOpen?.(dialog),
			outside: options().outside,
			onDismiss: (reason: LayerDismissReason) =>
				options().onDismiss(reason === "escape" ? "escape" : "outside"),
		});
		return () => layer.close();
	};
}
