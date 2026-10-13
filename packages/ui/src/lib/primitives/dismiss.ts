export type DismissReason = "escape" | "outside" | "focus-outside";

export interface DismissOptions {
	onDismiss(reason: DismissReason): void;
	/** Close on Escape. Default true. */
	escape?: boolean;
	/** Close on pointerdown outside (and focus moving outside). Default true. */
	outside?: boolean;
	/** Extra elements that count as "inside" (e.g. the trigger). */
	exclude?: () => Element[];
}

interface Layer {
	node: HTMLElement;
}

/** Open layers, bottom → top. Only the last one reacts to dismiss events. */
const stack: Layer[] = [];
let listening = false;

// Per-layer handlers live in a registry so one set of document listeners serves all layers.
const handlers = new Map<Layer, (type: "escape" | "pointerdown" | "focusin", e: Event) => void>();

function dispatch(type: "escape" | "pointerdown" | "focusin", e: Event) {
	const top = stack[stack.length - 1];
	if (top) handlers.get(top)?.(type, e);
}

const onKeydown = (e: KeyboardEvent) => {
	if (e.key === "Escape" && !e.defaultPrevented) dispatch("escape", e);
};
const onPointerdown = (e: PointerEvent) => dispatch("pointerdown", e);
const onFocusin = (e: FocusEvent) => dispatch("focusin", e);

function listen() {
	if (listening) return;
	listening = true;
	document.addEventListener("keydown", onKeydown, true);
	document.addEventListener("pointerdown", onPointerdown, true);
	document.addEventListener("focusin", onFocusin, true);
}

function unlisten() {
	if (!listening || stack.length) return;
	listening = false;
	document.removeEventListener("keydown", onKeydown, true);
	document.removeEventListener("pointerdown", onPointerdown, true);
	document.removeEventListener("focusin", onFocusin, true);
}

/**
 * Closes a layer on Escape / outside pointerdown / focus leaving it. Layers are stacked in
 * registration order: only the topmost reacts, so Escape closes a nested menu before its
 * parent dialog. Returns cleanup.
 *
 * Use as an attachment: `{@attach (n) => dismissable(n, { onDismiss })}`.
 */
export function dismissable(node: HTMLElement, options: DismissOptions): () => void {
	if (typeof document === "undefined") return () => {};
	const layer: Layer = { node };
	const opts = options;

	const inside = (target: EventTarget | null) => {
		if (!(target instanceof Node)) return false;
		if (node.contains(target)) return true;
		return (opts.exclude?.() ?? []).some((el) => el.contains(target));
	};

	handlers.set(layer, (type, e) => {
		if (type === "escape") {
			if (opts.escape === false) return;
			e.stopPropagation();
			opts.onDismiss("escape");
			return;
		}
		if (opts.outside === false) return;
		if (inside(e.target)) return;
		// A higher layer's content is portaled elsewhere, but it is already closed by the time
		// this layer is top again; anything else outside is a genuine outside interaction.
		opts.onDismiss(type === "pointerdown" ? "outside" : "focus-outside");
	});

	stack.push(layer);
	listen();

	return () => {
		const i = stack.indexOf(layer);
		if (i >= 0) stack.splice(i, 1);
		handlers.delete(layer);
		unlisten();
	};
}
