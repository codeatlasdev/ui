import { lockScroll, portal, trapFocus } from "../../primitives/index.js";

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
 * Attachment for a modal overlay whose panel IS a native `<dialog>` (Dialog, Sheet, Drawer, …).
 *
 * `showModal()` gives the top layer, the inert page and the `cancel` event (Escape); the scrim is the
 * dialog's `::backdrop`, so there is a single `role="dialog"` element and no wrapper. Dismissal never
 * closes the element itself, it only reports, so `open` stays the single source of truth and the exit
 * animation can play before the node is removed. Scroll is locked through the core ref-counted lock;
 * Tab is trapped and focus restored by the core.
 *
 *   <dialog class="ca-dialog" {@attach modalLayer(() => ({ onDismiss }))}>…</dialog>
 */
export function modalLayer(options: () => ModalLayerOptions) {
	return (dialog: HTMLElement): (() => void) => {
		if (!(dialog instanceof HTMLDialogElement)) return () => {};
		const { initial = "first", onOpen } = options();
		// Move to <body> first: the top layer fixes stacking, but a native <dialog> would still inherit
		// text styles and match descendant selectors (prose margins, table cells, uppercase labels)
		// from wherever it is declared. At <body> it starts from the base theme, like any portal.
		const unportal = portal()(dialog);
		const release = lockScroll();

		// Capture the opener before showModal() moves focus.
		const releaseFocus = trapFocus(dialog, { initial: false });
		if (!dialog.open) dialog.showModal();

		// Native showModal focuses the first focusable (or the dialog); steer it where asked.
		if (initial === "container" || initial === false) dialog.focus({ preventScroll: true });
		else if (initial instanceof HTMLElement) initial.focus({ preventScroll: true });
		onOpen?.(dialog);

		function onCancel(e: Event) {
			// Native Esc would close() the element and skip the exit animation; report instead.
			e.preventDefault();
			options().onDismiss("escape");
		}

		// A click on `::backdrop` is dispatched to the dialog with coordinates outside its box. Require the
		// press to start outside too: a drag that begins in the panel and ends on the scrim must not dismiss.
		const outsideBox = (e: MouseEvent) => {
			if (e.target !== dialog) return false;
			const r = dialog.getBoundingClientRect();
			return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
		};
		let downOutside = false;
		function onPointerdown(e: PointerEvent) {
			downOutside = outsideBox(e);
		}
		function onClick(e: MouseEvent) {
			const hit = downOutside && outsideBox(e);
			downOutside = false;
			if (hit && options().outside !== false) options().onDismiss("outside");
		}

		dialog.addEventListener("cancel", onCancel);
		dialog.addEventListener("pointerdown", onPointerdown);
		dialog.addEventListener("click", onClick);

		return () => {
			dialog.removeEventListener("cancel", onCancel);
			dialog.removeEventListener("pointerdown", onPointerdown);
			dialog.removeEventListener("click", onClick);
			if (dialog.open) dialog.close();
			releaseFocus();
			release();
			unportal();
		};
	};
}
