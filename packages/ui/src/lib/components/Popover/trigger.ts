import { createAttachmentKey } from "svelte/attachments";
import { focusables } from "../../primitives/index.js";

/**
 * Props object handed to `triggerChild` snippets (and spread onto the built-in trigger button).
 * One symbol-keyed attachment registers the anchor element; consumers just spread `{...props}`.
 */
export interface TriggerProps {
	id: string;
	"aria-haspopup": "dialog" | "menu" | "listbox" | undefined;
	"aria-expanded": boolean;
	"aria-controls": string | undefined;
	"data-state": "open" | "closed";
	onclick: (e: MouseEvent) => void;
	onkeydown?: (e: KeyboardEvent) => void;
	[key: string]: unknown;
	[key: symbol]: unknown;
}

export interface TriggerOptions {
	id: string;
	popup: "dialog" | "menu" | "listbox";
	open: boolean;
	controls?: string;
	onToggle: () => void;
	onKeydown?: (e: KeyboardEvent) => void;
	setAnchor: (el: HTMLElement | null) => void;
}

/**
 * A portaled popup sits at the end of `<body>`, so natural Tab order from the trigger skips it.
 * Call from the trigger's keydown: Tab (forward) while open moves into the popup's first tabbable.
 * Returns true when it handled the event.
 */
export function tabIntoPopup(e: KeyboardEvent, popup: HTMLElement | null): boolean {
	if (e.key !== "Tab" || e.shiftKey || !popup) return false;
	const first = focusables(popup)[0];
	if (!first) return false;
	e.preventDefault();
	first.focus();
	return true;
}

/** One attachment key per component instance: a fresh key per render would re-run the attachment. */
export function createTriggerProps(setAnchor: (el: HTMLElement | null) => void) {
	const key = createAttachmentKey();
	const attach = (node: HTMLElement) => {
		setAnchor(node);
		return () => setAnchor(null);
	};
	return ({
		id,
		popup,
		open,
		controls,
		onToggle,
		onKeydown,
	}: Omit<TriggerOptions, "setAnchor">): TriggerProps => ({
		id,
		"aria-haspopup": popup,
		"aria-expanded": open,
		"aria-controls": open ? controls : undefined,
		"data-state": open ? "open" : "closed",
		onclick: () => onToggle(),
		onkeydown: onKeydown,
		[key]: attach,
	});
}
