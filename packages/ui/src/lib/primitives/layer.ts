import { type Align, float, type Side } from "./floating.js";
import { opener, trapFocus } from "./focus.js";
import { lockScroll } from "./scroll-lock.js";

/**
 * The single layer stack. Every overlay (dialog, sheet, menu, popover, tooltip) goes through
 * `openLayer`, so there is one place for the top layer, Escape / outside press / focus-out, focus
 * restoration, scroll lock and the `layerchange` event hosts listen to.
 *
 * - `modal`   → `<dialog>.showModal()`: top layer, inert page, scroll locked, focus trapped.
 * - `popover` → `popover="manual"` + `showPopover()`: top layer, light dismiss handled by the stack.
 * - `hint`    → same element mode as `popover`, but it never takes Escape or outside presses
 *               (tooltips are closed by their trigger).
 *
 * The top layer replaces z-index: a layer opened later always paints above an earlier one, so a
 * menu inside a dialog is on top without any stacking contexts. `manual` (not `auto`) is
 * deliberate: with `auto` the browser light-dismisses on its own schedule and would race the stack
 * that decides which layer a press belongs to.
 */

export type LayerKind = "modal" | "popover" | "hint";
export type LayerDismissReason = "escape" | "outside" | "focus-outside";
export type LayerPositioning = "css" | "js";

export interface LayerOptions {
	kind: LayerKind;
	/** Called when Escape / an outside press / focus leaving asks to close. Never closes the layer itself. */
	onDismiss?(reason: LayerDismissReason): void;
	/** Close on Escape. Default true (ignored for hints). */
	escape?: boolean;
	/** Close on press outside (modal: on the scrim). Default true (ignored for hints). */
	outside?: boolean;
	/** Also report focus moving outside a popover. Default false (menus and popovers keep focus explicit). */
	focusOutside?: boolean;
	/** Positioning reference for popovers/hints. Always counts as "inside" for outside presses. */
	anchor?: Element | null;
	/** Extra elements treated as inside (e.g. a sub-trigger). */
	exclude?: () => Element[];
	side?: Side;
	align?: Align;
	sideOffset?: number;
	collisionPadding?: number;
	flip?: boolean;
	shift?: boolean;
	/** Make the layer as wide as the anchor. */
	sameWidth?: boolean;
	/** Force a positioning path. Default: CSS anchor positioning when supported, else floating-ui. */
	positioning?: LayerPositioning;
	/** Modal only: where focus lands on open. `'first'` = native, `'container'` = the dialog, an element, or `false`. */
	initialFocus?: "first" | "container" | HTMLElement | false;
	/** Modal only: runs once shown and focused. */
	onOpen?(el: HTMLElement): void;
	/** Hand focus back to the opener (modal) or the anchor (popover) on close. Default true. */
	restoreFocus?: boolean;
	/** Leave a modal where it is declared. Default false: it is moved to `<body>` so it does not inherit typography. */
	inPlace?: boolean;
}

export interface LayerHandle {
	/** Re-run positioning (content size changed). */
	update(): void;
	/** Remove the layer from the stack and the top layer. Idempotent. */
	close(): void;
}

export interface LayerInfo {
	kind: LayerKind;
	rect: DOMRect;
}

/** Detail of the `layerchange` event on `document`. */
export interface LayerChange {
	/** Open layers, bottom → top. */
	layers: LayerInfo[];
	count: number;
	/** At least one modal layer is open (the page behind is inert). */
	modal: boolean;
}

interface Entry {
	node: HTMLElement;
	kind: LayerKind;
	opts: LayerOptions;
	/** Popover/hint only, while hosted in a modal: a comment left in the owner's range where the node was declared. */
	home?: Comment;
	dismiss(type: "escape" | "pointerdown" | "focusin", e: Event): void;
}

/** Open layers, bottom → top. Only the last interactive one reacts to dismiss events. */
const stack: Entry[] = [];
let listening = false;

function topModal(): HTMLElement | undefined {
	for (let i = stack.length - 1; i >= 0; i--) if (stack[i].kind === "modal") return stack[i].node;
}

function topInteractive(): Entry | undefined {
	for (let i = stack.length - 1; i >= 0; i--) if (stack[i].kind !== "hint") return stack[i];
}

/**
 * `showModal()` makes everything outside the dialog inert, *including top-layer popovers*: a layer
 * must live inside the topmost open modal to stay interactive. Moves `entry` there (leaving a
 * comment where its owner declared it, or taking it back to that spot when no modal is open) and
 * re-enters the top layer so it paints above a modal that just opened. Moving a `popover="manual"`
 * element hides it, hence the re-show.
 */
function rehost(entry: Entry) {
	const el = entry.node;
	const host = topModal();
	if (host) {
		if (host.contains(el)) return;
		if (!entry.home) {
			entry.home = document.createComment("ca-layer");
			el.before(entry.home);
		}
		host.appendChild(el);
	} else if (entry.home) {
		if (entry.home.isConnected) entry.home.replaceWith(el);
		else el.remove();
		entry.home = undefined;
	} else return;
	if (el.hasAttribute("popover") && !el.matches(":popover-open")) el.showPopover();
}

/** Closing a popover/hint: put it back where its owner declared it (or drop it if that range is gone). */
function restore(entry: Entry) {
	const { home, node } = entry;
	if (!home) return;
	if (home.isConnected) home.replaceWith(node);
	else node.remove();
	entry.home = undefined;
}

const onKeydown = (e: KeyboardEvent) => {
	if (e.key === "Escape" && !e.defaultPrevented) topInteractive()?.dismiss("escape", e);
};
const onPointerdown = (e: PointerEvent) => topInteractive()?.dismiss("pointerdown", e);
const onFocusin = (e: FocusEvent) => topInteractive()?.dismiss("focusin", e);

function listen(on: boolean) {
	if (on === listening) return;
	listening = on;
	const method = on ? "addEventListener" : "removeEventListener";
	document[method]("keydown", onKeydown as EventListener, true);
	document[method]("pointerdown", onPointerdown as EventListener, true);
	document[method]("focusin", onFocusin as EventListener, true);
}

function announce() {
	const layers = stack.map((l) => ({ kind: l.kind, rect: l.node.getBoundingClientRect() }));
	const detail: LayerChange = {
		layers,
		count: layers.length,
		modal: stack.some((l) => l.kind === "modal"),
	};
	document.dispatchEvent(new CustomEvent<LayerChange>("layerchange", { detail }));
}

/**
 * Subscribes to `layerchange`: fired on `document` whenever a layer opens or closes, with the open
 * layers and their rects. Hosts that draw outside the DOM (native views over a webview) park or
 * snapshot them from here. Returns the unsubscribe function.
 */
export function onLayerChange(listener: (change: LayerChange) => void): () => void {
	if (typeof document === "undefined") return () => {};
	const handler = (e: Event) => listener((e as CustomEvent<LayerChange>).detail);
	document.addEventListener("layerchange", handler);
	return () => document.removeEventListener("layerchange", handler);
}

/** CSS anchor positioning in the engine that is running (`position-area` is the part we rely on). */
function supportsAnchor() {
	return (
		typeof CSS !== "undefined" &&
		CSS.supports("position-area: bottom") &&
		CSS.supports("anchor-name: --a")
	);
}

let anchorSeq = 0;

/** `position-area` for a side + alignment, matching floating-ui's `side-align` placement. */
function areaFor(side: Side, align: Align) {
	const span =
		side === "top" || side === "bottom" ? ["span-right", "span-left"] : ["span-bottom", "span-top"];
	return align === "center" ? side : `${side} ${align === "start" ? span[0] : span[1]}`;
}

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

/** Which side of the anchor the layer ended up on, read from geometry (CSS fallbacks flip silently). */
function resolvedSide(anchor: DOMRect, layer: DOMRect, wanted: Side): Side {
	const above = layer.bottom <= anchor.top + 1;
	const below = layer.top >= anchor.bottom - 1;
	const left = layer.right <= anchor.left + 1;
	const right = layer.left >= anchor.right - 1;
	if (wanted === "top" || wanted === "bottom") return above ? "top" : below ? "bottom" : wanted;
	return left ? "left" : right ? "right" : wanted;
}

interface Placement {
	update(): void;
	stop(): void;
}

/** Anchors with CSS (`anchor-name` / `position-area` / `position-try-fallbacks`) and mirrors the resolved side onto `data-side`. */
function anchorWithCss(node: HTMLElement, anchor: HTMLElement, o: LayerOptions): Placement {
	const { side = "bottom", align = "start", sideOffset = 0, flip = true, sameWidth = false } = o;
	const name = `--ca-anchor-${++anchorSeq}`;
	const prevAnchorName = anchor.style.getPropertyValue("anchor-name");
	anchor.style.setProperty("anchor-name", name);

	node.style.setProperty("position-anchor", name);
	node.style.setProperty("position-area", areaFor(side, align));
	node.style.setProperty("inset", "auto");
	node.style.setProperty("margin", "0");
	node.style.setProperty(`margin-${OPPOSITE[side]}`, `${sideOffset}px`);
	node.style.setProperty(
		"position-try-fallbacks",
		flip ? (side === "top" || side === "bottom" ? "flip-block" : "flip-inline") : "none"
	);
	node.style.setProperty("--ca-anchor-width", `${anchor.getBoundingClientRect().width}px`);
	if (sameWidth) node.style.setProperty("width", "var(--ca-anchor-width)");

	let frame = 0;
	const sync = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const a = anchor.getBoundingClientRect();
			node.style.setProperty("--ca-anchor-width", `${a.width}px`);
			node.dataset.side = resolvedSide(a, node.getBoundingClientRect(), side);
			node.dataset.align = align;
		});
	};
	sync();
	const ro = new ResizeObserver(sync);
	ro.observe(anchor);
	ro.observe(node);
	addEventListener("scroll", sync, true);
	addEventListener("resize", sync);

	return {
		update: sync,
		stop() {
			cancelAnimationFrame(frame);
			ro.disconnect();
			removeEventListener("scroll", sync, true);
			removeEventListener("resize", sync);
			if (prevAnchorName) anchor.style.setProperty("anchor-name", prevAnchorName);
			else anchor.style.removeProperty("anchor-name");
			for (const p of [
				"position-anchor",
				"position-area",
				"inset",
				"margin",
				`margin-${OPPOSITE[side]}`,
				"position-try-fallbacks",
				"width",
			])
				node.style.removeProperty(p);
		},
	};
}

/** floating-ui path. The element is a `fixed` top-layer box, so `float()` positions it from the viewport origin. */
function anchorWithJs(node: HTMLElement, anchor: HTMLElement, o: LayerOptions): Placement {
	const handle = float(anchor, node, o);
	return {
		update: handle.update,
		stop() {
			handle();
			for (const p of ["position", "inset", "margin", "translate", "width"])
				node.style.removeProperty(p);
		},
	};
}

function placeAnchored(node: HTMLElement, o: LayerOptions): Placement {
	const anchor = o.anchor;
	if (!(anchor instanceof HTMLElement)) return { update() {}, stop() {} };
	const mode = o.positioning ?? (supportsAnchor() ? "css" : "js");
	return mode === "css" ? anchorWithCss(node, anchor, o) : anchorWithJs(node, anchor, o);
}

/** A press / focus target belongs to the layer, its anchor, or an explicit exclusion. */
function isInside(e: Entry, target: EventTarget | null) {
	if (!(target instanceof Node)) return false;
	const { anchor, exclude } = e.opts;
	return (
		e.node.contains(target) ||
		!!anchor?.contains(target) ||
		(exclude?.() ?? []).some((x) => x.contains(target))
	);
}

/** Pointer coordinates outside the dialog box = a press on `::backdrop` (dispatched to the dialog itself). */
function onScrim(dialog: HTMLElement, e: MouseEvent) {
	if (e.target !== dialog) return false;
	const r = dialog.getBoundingClientRect();
	return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}

/**
 * Opens `el` as a layer and returns its handle. The element must exist already (it is not created
 * here); a `<dialog>` for `modal`, any element for `popover` / `hint`.
 *
 * Dismissal only *reports* (`onDismiss`): the caller flips its `open` state, so the exit animation
 * can play before `close()` removes the layer.
 */
export function openLayer(el: HTMLElement, options: LayerOptions): LayerHandle {
	// Server render, or a node its owner already removed (an effect re-running mid-teardown): nothing to show.
	if (typeof document === "undefined" || !el.isConnected) return { update() {}, close() {} };
	const { kind } = options;
	// Not `document.activeElement`: Safari leaves <body> or an ancestor focused after a tap on the opener.
	const restoreTo = opener();
	const cleanups: Array<() => void> = [];
	let closed = false;

	const entry: Entry = {
		node: el,
		kind,
		opts: options,
		dismiss(type, e) {
			if (type === "escape") {
				if (options.escape === false) return;
				e.stopPropagation();
				options.onDismiss?.("escape");
				return;
			}
			if (options.outside === false || kind === "modal") return;
			if (type === "focusin" && !options.focusOutside) return;
			if (isInside(entry, e.target)) return;
			options.onDismiss?.(type === "pointerdown" ? "outside" : "focus-outside");
		},
	};

	let update = () => {};

	if (kind === "modal") {
		if (!(el instanceof HTMLDialogElement))
			throw new TypeError("openLayer: a modal layer needs a <dialog>");
		const dialog = el;
		const { initialFocus = "first", onOpen } = options;
		if (!options.inPlace) {
			// A native <dialog> keeps inheriting text styles and descendant selectors from where it is
			// declared (prose margins, table cells, uppercase labels). At <body> it starts from the base theme.
			const marker = document.createComment("ca-layer");
			dialog.before(marker);
			document.body.appendChild(dialog);
			// Svelte only removes the nodes it placed: a node moved to <body> has left its range, so
			// destroying the owner's branch must remove it here (restoring it would resurrect it).
			cleanups.push(() => {
				dialog.remove();
				marker.remove();
			});
		}
		cleanups.push(lockScroll());
		// Capture focus before showModal() moves it; restoration is ours, not the trap's.
		cleanups.push(trapFocus(dialog, { initial: false, restore: false }));
		if (!dialog.open) dialog.showModal();
		if (initialFocus === "container" || initialFocus === false)
			dialog.focus({ preventScroll: true });
		else if (initialFocus instanceof HTMLElement) initialFocus.focus({ preventScroll: true });
		onOpen?.(dialog);

		// Escape is owned by the stack's keydown path (it also covers Escape pressed while focus is in a
		// nested popover). The native `cancel` that follows must only be stopped: letting it through would
		// close() the element and skip the exit animation, and reporting it too would dismiss twice.
		const onCancel = (e: Event) => e.preventDefault();
		// Require the press to start on the scrim too: a drag from the panel onto it must not dismiss.
		let downOnScrim = false;
		const onDown = (e: PointerEvent) => {
			downOnScrim = onScrim(dialog, e);
		};
		const onClick = (e: MouseEvent) => {
			const hit = downOnScrim && onScrim(dialog, e);
			downOnScrim = false;
			if (hit && options.outside !== false) options.onDismiss?.("outside");
		};
		dialog.addEventListener("cancel", onCancel);
		dialog.addEventListener("pointerdown", onDown);
		dialog.addEventListener("click", onClick);
		cleanups.push(() => {
			dialog.removeEventListener("cancel", onCancel);
			dialog.removeEventListener("pointerdown", onDown);
			dialog.removeEventListener("click", onClick);
			if (dialog.open) dialog.close();
		});
	} else {
		// Inside the topmost open modal (see `rehost`); a later modal pulls it in, a closing one hands it on.
		rehost(entry);
		// Svelte removes only the nodes it placed: if the owner's range is gone (marker detached), a
		// node that was moved away must go with it rather than be resurrected at the old spot.
		cleanups.push(() => restore(entry));
		el.setAttribute("popover", "manual");
		if (!el.matches(":popover-open")) el.showPopover();
		const placement = placeAnchored(el, options);
		update = placement.update;
		cleanups.push(placement.stop);
		cleanups.push(() => {
			if (el.matches(":popover-open")) el.hidePopover();
			el.removeAttribute("popover");
		});
	}

	stack.push(entry);
	// A modal that opens over already-open popovers/hints takes them in so they stay interactive above it.
	if (kind === "modal") for (const other of stack) if (other.kind !== "modal") rehost(other);
	listen(true);
	announce();

	return {
		update() {
			if (!closed) update();
		},
		close() {
			if (closed) return;
			closed = true;
			const i = stack.indexOf(entry);
			if (i >= 0) stack.splice(i, 1);
			if (!stack.length) listen(false);
			// Popovers hosted in this modal go to the next modal (or home) before it is removed with them inside.
			if (kind === "modal") for (const other of stack) if (other.kind !== "modal") rehost(other);
			while (cleanups.length) cleanups.pop()?.();
			if (options.restoreFocus !== false) {
				const target = kind === "modal" ? restoreTo : (options.anchor ?? restoreTo);
				if (target instanceof HTMLElement && target.isConnected)
					target.focus({ preventScroll: true });
			}
			announce();
		},
	};
}
