// ─── dnd: drag and drop engine (plain TypeScript, no Svelte) ──────────────────
// One model for sortable lists, moves between lists and drop zones:
//   - a *container* is a sortable list (`mode: "sort"`) or a drop zone (`mode: "zone"`);
//   - an *item* is an element carrying `data-dnd-item="<id>"` inside a sortable container, or a
//     standalone draggable registered with `draggable()`.
// The engine measures the item boxes once when a drag starts and computes the target per frame from
// those cached rects; while moving it only touches the overlay (`transform`), the drop indicator and
// `data-dnd-*` attributes. It never re-renders the items: the app commits the new order in `onDrop`.
//
// Inputs: mouse and pen (a 4px threshold), touch (press and hold, so scrolling still works), and
// keyboard (Space lifts, arrows move, Enter drops, Escape cancels). Every step is announced through
// the shared live region (`announce`).

import { announce } from "../utils/announce.js";

/** Where an item sits: a container id and an index inside it (zones use index 0). */
export interface DndPosition {
	container: string;
	index: number;
}

export interface DndDropEvent<T = unknown> {
	id: string;
	data: T | undefined;
	from: DndPosition;
	to: DndPosition;
}

/** Screen reader strings. `i18n` fills them from the locale catalog; each is optional. */
export interface DndMessages {
	/** Instructions read with the handle (`aria-describedby`). */
	instructions: string;
	lifted: (label: string, position: number, total: number) => string;
	/** `container` is set when the item is in another list than the one it came from. */
	moved: (label: string, position: number, total: number, container?: string) => string;
	over: (label: string, zone: string) => string;
	dropped: (label: string, position: number, total: number, container?: string) => string;
	cancelled: (label: string) => string;
}

export const DEFAULT_MESSAGES: DndMessages = {
	instructions:
		"Press Space to lift, the arrow keys to move, Enter to drop and Escape to cancel. Touch: press and hold, then drag.",
	lifted: (label, position, total) => `Lifted ${label}, position ${position} of ${total}.`,
	moved: (label, position, total, container) =>
		`${label}, ${container ? `${container}, ` : ""}position ${position} of ${total}.`,
	over: (label, zone) => `${label} over ${zone}.`,
	dropped: (label, position, total, container) =>
		`Dropped ${label}${container ? ` in ${container}` : ""}, position ${position} of ${total}.`,
	cancelled: (label) => `Cancelled. ${label} returned to its place.`,
};

export interface SortableOptions {
	/** Container id; lists that share a `group` accept each other's items. */
	id: string;
	/** Containers with the same `group` exchange items. Default: the container `id` (no exchange). */
	group?: string;
	/** Ids of the items, in order. Read on every drag start. */
	getItems: () => readonly string[];
	/** Human name of an item for announcements. Default: the element text. */
	getLabel?: (id: string) => string;
	/** Human name of the container for announcements. Default: `id`. */
	label?: string;
	axis?: "y" | "x";
	/** CSS selector of the handle inside an item. Without it the whole item drags. */
	handle?: string;
	disabled?: boolean;
	/** Commit the move (same container: reorder; another container: move). */
	onDrop: (e: DndDropEvent) => void;
}

export interface DraggableOptions<T = unknown> {
	id: string;
	data?: T;
	label?: string;
	handle?: string;
	disabled?: boolean;
	/** The element to move; defaults to the node. */
	onDrop?: (e: DndDropEvent<T>) => void;
}

export interface DropzoneOptions {
	id: string;
	/** Same meaning as `SortableOptions.group`. Default: accepts everything. */
	group?: string;
	label?: string;
	disabled?: boolean;
	/** Return false to refuse an item (the zone does not highlight). */
	accepts?: (id: string, data: unknown) => boolean;
	onDrop: (e: DndDropEvent) => void;
}

export interface DndOptions {
	/** Strings, or a getter read at every announcement (follows a locale change). */
	messages?: Partial<DndMessages> | (() => Partial<DndMessages>);
	/** Pixels the pointer must travel before a mouse/pen drag starts. Default 4. */
	threshold?: number;
	/** Press-and-hold time for touch, ms. Default 350. */
	holdMs?: number;
	/** Distance from a scroll container edge that auto-scrolls, px. Default 48. */
	edge?: number;
	/** Return true to skip every animation (reduced motion). Default: the media query. */
	reducedMotion?: () => boolean;
	/** Overlay parent. Default `document.body`. */
	root?: HTMLElement;
	/** Called when a drag starts (id) and ends (null). */
	onActiveChange?: (id: string | null) => void;
}

/** What `sortable`/`draggable`/`dropzone` return: a cleanup that also takes new options. */
export type DndHandle<O> = (() => void) & { update(options: O): void };

export interface DndController {
	sortable(node: HTMLElement, options: SortableOptions): DndHandle<SortableOptions>;
	draggable<T>(node: HTMLElement, options: DraggableOptions<T>): DndHandle<DraggableOptions<T>>;
	dropzone(node: HTMLElement, options: DropzoneOptions): DndHandle<DropzoneOptions>;
	/** Id of the item being dragged, or null. */
	readonly active: string | null;
	/** Abort the drag in progress (as Escape). */
	cancel(): void;
	/** The strings in use right now. */
	readonly messages: DndMessages;
	destroy(): void;
}

interface Container {
	node: HTMLElement;
	kind: "sort" | "zone";
	id: string;
	group: string | undefined;
	label: string;
	sort?: SortableOptions;
	zone?: DropzoneOptions;
}

interface Standalone {
	node: HTMLElement;
	options: DraggableOptions<unknown>;
}

interface Slot {
	id: string;
	el: HTMLElement;
	rect: DOMRect;
}

interface Session {
	id: string;
	data: unknown;
	label: string;
	source: Container | null;
	from: DndPosition;
	itemEl: HTMLElement;
	/** Rects of every container at drag start (with the page scroll folded in at read time). */
	slots: Map<Container, Slot[]>;
	overlay: HTMLElement | null;
	indicator: HTMLElement;
	offsetX: number;
	offsetY: number;
	originRect: DOMRect;
	target: { container: Container; index: number } | null;
	mode: "pointer" | "keyboard";
	pointerId: number;
	lastX: number;
	lastY: number;
	scrollRaf: number;
	/** Items per container as announced / drawn (the source minus the dragged one is the slot list). */
	itemsOf: Map<Container, string[]>;
	/** Keyboard drags: the focused handle, so focus can follow the item after the app re-renders. */
	handleEl: HTMLElement | null;
	/** Selector of the handle inside the item (empty: the item itself). */
	handleSelector: string;
}

const ATTR_ITEM = "data-dnd-item";

function prefersReduced(): boolean {
	return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollParent(el: HTMLElement): HTMLElement | null {
	for (let p = el.parentElement; p; p = p.parentElement) {
		const { overflowY, overflowX } = getComputedStyle(p);
		if (
			/(auto|scroll)/.test(overflowY + overflowX) &&
			(p.scrollHeight > p.clientHeight || p.scrollWidth > p.clientWidth)
		)
			return p;
	}
	return null;
}

export function createDnd(options: DndOptions = {}): DndController {
	const resolveMessages = (): DndMessages => ({
		...DEFAULT_MESSAGES,
		...(typeof options.messages === "function" ? options.messages() : options.messages),
	});
	const threshold = options.threshold ?? 4;
	const holdMs = options.holdMs ?? 350;
	const edge = options.edge ?? 48;
	const reduced = options.reducedMotion ?? prefersReduced;

	const containers = new Set<Container>();
	const standalones = new Set<Standalone>();
	let session: Session | null = null;
	let cleanups: Array<() => void> = [];

	// ── helpers ────────────────────────────────────────────────────────────────

	const accepts = (c: Container, s: Session): boolean => {
		if (c.kind === "zone") {
			const z = c.zone as DropzoneOptions;
			if (z.disabled) return false;
			if (z.group !== undefined && s.source && (s.source.group ?? s.source.id) !== z.group)
				return false;
			return z.accepts ? z.accepts(s.id, s.data) : true;
		}
		const o = c.sort as SortableOptions;
		if (o.disabled) return false;
		if (!s.source) return true;
		return (s.source.group ?? s.source.id) === (c.group ?? c.id);
	};

	function itemElements(c: Container): HTMLElement[] {
		return Array.from(c.node.querySelectorAll<HTMLElement>(`[${ATTR_ITEM}]`)).filter(
			(el) => el.closest(`[data-dnd-container]`) === c.node
		);
	}

	function labelOf(c: Container | null, id: string, el: HTMLElement | null): string {
		const fromOptions = c?.sort?.getLabel?.(id);
		if (fromOptions) return fromOptions;
		return (
			(el?.getAttribute("aria-label") ?? el?.textContent ?? id).trim().replace(/\s+/g, " ") || id
		);
	}

	function measure(s: Session) {
		s.slots = new Map();
		s.itemsOf = new Map();
		for (const c of containers) {
			if (!accepts(c, s)) continue;
			const els = c.kind === "sort" ? itemElements(c) : [];
			const slots: Slot[] = [];
			const ids: string[] = [];
			for (const el of els) {
				const id = el.getAttribute(ATTR_ITEM) as string;
				if (id === s.id) continue;
				slots.push({ id, el, rect: el.getBoundingClientRect() });
				ids.push(id);
			}
			s.slots.set(c, slots);
			s.itemsOf.set(c, ids);
		}
	}

	function indexIn(c: Container, s: Session, x: number, y: number): number {
		const slots = s.slots.get(c) ?? [];
		const horizontal = c.sort?.axis === "x";
		let index = slots.length;
		for (let i = 0; i < slots.length; i++) {
			const r = slots[i].rect;
			const mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2;
			if ((horizontal ? x : y) < mid) {
				index = i;
				break;
			}
		}
		return index;
	}

	function containerAt(s: Session, x: number, y: number): Container | null {
		let best: Container | null = null;
		let bestArea = Number.POSITIVE_INFINITY;
		for (const c of s.slots.keys()) {
			const r = c.node.getBoundingClientRect();
			if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
			// The smallest container under the pointer wins (a zone inside a list, a list in a board).
			const area = r.width * r.height;
			if (area < bestArea) {
				best = c;
				bestArea = area;
			}
		}
		return best;
	}

	// ── indicator and overlay ──────────────────────────────────────────────────

	function makeIndicator(): HTMLElement {
		const el = document.createElement("div");
		el.className = "ca-dnd-indicator";
		el.setAttribute("aria-hidden", "true");
		el.hidden = true;
		return el;
	}

	function placeIndicator(s: Session) {
		const t = s.target;
		const ind = s.indicator;
		if (!t) {
			ind.hidden = true;
			return;
		}
		const c = t.container;
		if (c.kind === "zone") {
			ind.hidden = true;
			return;
		}
		const slots = s.slots.get(c) ?? [];
		const horizontal = c.sort?.axis === "x";
		const host = c.node.getBoundingClientRect();
		const before = slots[t.index];
		const after = slots[t.index - 1];
		ind.hidden = false;
		if (!ind.isConnected) (options.root ?? document.body).append(ind);
		ind.dataset.axis = horizontal ? "x" : "y";
		let pos: number;
		if (before) pos = horizontal ? before.rect.left : before.rect.top;
		else if (after) pos = horizontal ? after.rect.right : after.rect.bottom;
		else pos = horizontal ? host.left : host.top;
		if (horizontal) {
			ind.style.transform = `translate(${pos - 1}px, ${host.top}px)`;
			ind.style.height = `${host.height}px`;
			ind.style.width = "";
		} else {
			ind.style.transform = `translate(${host.left}px, ${pos - 1}px)`;
			ind.style.width = `${host.width}px`;
			ind.style.height = "";
		}
	}

	function setTarget(s: Session, target: Session["target"]) {
		const prev = s.target;
		if (prev && target && prev.container === target.container && prev.index === target.index)
			return;
		if (prev && prev.container !== target?.container)
			prev.container.node.removeAttribute("data-dnd-over");
		s.target = target;
		if (target) target.container.node.setAttribute("data-dnd-over", "");
		placeIndicator(s);
	}

	function createOverlay(s: Session): HTMLElement {
		const clone = s.itemEl.cloneNode(true) as HTMLElement;
		clone.removeAttribute("id");
		for (const el of clone.querySelectorAll("[id]")) el.removeAttribute("id");
		clone.removeAttribute(ATTR_ITEM);
		clone.setAttribute("aria-hidden", "true");
		clone.removeAttribute("tabindex");
		clone.classList.add("ca-dnd-overlay");
		clone.style.width = `${s.originRect.width}px`;
		clone.style.height = `${s.originRect.height}px`;
		(options.root ?? document.body).append(clone);
		return clone;
	}

	function moveOverlay(s: Session, x: number, y: number) {
		if (!s.overlay) return;
		s.overlay.style.transform = `translate(${x - s.offsetX}px, ${y - s.offsetY}px)`;
	}

	// ── announcements ──────────────────────────────────────────────────────────

	function position(s: Session): { pos: number; total: number; c: Container | null } {
		const t = s.target;
		if (!t)
			return {
				pos: s.from.index + 1,
				total: (s.itemsOf.get(s.source as Container)?.length ?? 0) + 1,
				c: s.source,
			};
		const total = (s.itemsOf.get(t.container)?.length ?? 0) + 1;
		return {
			pos: t.container.kind === "zone" ? 1 : t.index + 1,
			total: t.container.kind === "zone" ? 1 : total,
			c: t.container,
		};
	}

	/** Announces where the held item is now (a zone, or a position in a list). */
	function sayMoved(s: Session) {
		const { pos, total, c } = position(s);
		if (c?.kind === "zone") announce(resolveMessages().over(s.label, c.label));
		else
			announce(
				resolveMessages().moved(s.label, pos, total, c && c !== s.source ? c.label : undefined)
			);
	}

	// ── session lifecycle ──────────────────────────────────────────────────────

	function begin(
		id: string,
		data: unknown,
		source: Container | null,
		itemEl: HTMLElement,
		mode: Session["mode"],
		pointerId: number,
		label?: string
	): Session | null {
		if (session) return null;
		const originRect = itemEl.getBoundingClientRect();
		const index = source ? itemElements(source).indexOf(itemEl) : 0;
		const s: Session = {
			id,
			data,
			label: label ?? labelOf(source, id, itemEl),
			source,
			from: { container: source?.id ?? "", index: Math.max(0, index) },
			itemEl,
			slots: new Map(),
			overlay: null,
			indicator: makeIndicator(),
			offsetX: 0,
			offsetY: 0,
			originRect,
			target: null,
			mode,
			pointerId,
			lastX: originRect.left,
			lastY: originRect.top,
			scrollRaf: 0,
			itemsOf: new Map(),
			handleEl: null,
			handleSelector: "",
		};
		session = s;
		options.onActiveChange?.(id);
		measure(s);
		itemEl.setAttribute("data-dnd-dragging", "");
		document.documentElement.setAttribute("data-dnd-active", "");
		if (source) setTarget(s, { container: source, index: s.from.index });
		return s;
	}

	/**
	 * A keyed list moves the dropped item's node, and moving a node drops its focus. Once the app has
	 * re-rendered, put focus back on the same handle (found again by item id) so a keyboard user can
	 * keep going. Runs only when focus was lost, never steals it from elsewhere.
	 */
	function restoreFocus(s: Session) {
		if (!s.handleEl) return;
		const refocus = () => {
			if (document.activeElement && document.activeElement !== document.body) return;
			const item = document.querySelector<HTMLElement>(`[${ATTR_ITEM}="${CSS.escape(s.id)}"]`);
			const handle = s.handleEl?.isConnected
				? s.handleEl
				: s.handleSelector
					? item?.querySelector<HTMLElement>(s.handleSelector)
					: item;
			handle?.focus();
		};
		queueMicrotask(() => requestAnimationFrame(refocus));
	}

	function finish(commit: boolean) {
		const s = session;
		if (!s) return;
		session = null;
		options.onActiveChange?.(null);
		cancelAnimationFrame(s.scrollRaf);
		for (const off of cleanups) off();
		cleanups = [];
		const t = s.target;
		s.itemEl.removeAttribute("data-dnd-dragging");
		document.documentElement.removeAttribute("data-dnd-active");
		for (const c of containers) c.node.removeAttribute("data-dnd-over");
		s.indicator.remove();
		const overlay = s.overlay;
		const done = () => overlay?.remove();
		if (overlay) {
			if (!reduced() && !commit) {
				const r = s.itemEl.getBoundingClientRect();
				overlay
					.animate(
						[
							{ transform: overlay.style.transform },
							{ transform: `translate(${r.left}px, ${r.top}px)` },
						],
						{
							duration: 180,
							easing: "cubic-bezier(0.2, 0, 0, 1)",
						}
					)
					.finished.then(done, done);
			} else done();
		}
		if (!commit || !t) {
			announce(resolveMessages().cancelled(s.label));
			restoreFocus(s);
			return;
		}
		const to: DndPosition = {
			container: t.container.id,
			index: t.container.kind === "zone" ? 0 : t.index,
		};
		const sameSpot =
			to.container === s.from.container && to.index === s.from.index && t.container.kind === "sort";
		const total = (s.itemsOf.get(t.container)?.length ?? 0) + 1;
		if (sameSpot) {
			announce(resolveMessages().dropped(s.label, to.index + 1, total), "assertive");
			return;
		}
		const zone = t.container.kind === "zone";
		announce(
			resolveMessages().dropped(
				s.label,
				zone ? 1 : to.index + 1,
				zone ? 1 : total,
				t.container !== s.source ? t.container.label : undefined
			),
			"assertive"
		);
		const event: DndDropEvent = { id: s.id, data: s.data, from: s.from, to };
		if (t.container.kind === "zone") t.container.zone?.onDrop(event);
		else t.container.sort?.onDrop(event);
		restoreFocus(s);
		// A standalone draggable also hears its own drop.
		for (const d of standalones) if (d.node === s.itemEl) d.options.onDrop?.(event);
	}

	// ── pointer drag ───────────────────────────────────────────────────────────

	function autoScroll(s: Session) {
		const tick = () => {
			if (session !== s) return;
			let moved = false;
			const pts = [document.elementFromPoint(s.lastX, s.lastY)];
			for (const start of pts) {
				for (let el = start as HTMLElement | null; el; el = el.parentElement) {
					const sp = scrollParent(el);
					if (!sp) break;
					const r = sp.getBoundingClientRect();
					const dy = s.lastY < r.top + edge ? -1 : s.lastY > r.bottom - edge ? 1 : 0;
					const dx = s.lastX < r.left + edge ? -1 : s.lastX > r.right - edge ? 1 : 0;
					if (dy || dx) {
						const depth =
							(dy < 0 ? r.top + edge - s.lastY : dy > 0 ? s.lastY - (r.bottom - edge) : 0) ||
							(dx < 0 ? r.left + edge - s.lastX : s.lastX - (r.right - edge));
						const speed = Math.max(2, Math.min(18, depth / 3));
						sp.scrollTop += dy * speed;
						sp.scrollLeft += dx * speed;
						moved = true;
					}
					el = sp;
				}
			}
			if (moved) {
				// The boxes moved under the pointer: re-measure and retarget.
				measure(s);
				retarget(s, s.lastX, s.lastY);
			}
			s.scrollRaf = requestAnimationFrame(tick);
		};
		s.scrollRaf = requestAnimationFrame(tick);
	}

	function retarget(s: Session, x: number, y: number) {
		const c = containerAt(s, x, y);
		if (!c) {
			setTarget(s, null);
			return;
		}
		setTarget(s, { container: c, index: c.kind === "zone" ? 0 : indexIn(c, s, x, y) });
	}

	function startPointerDrag(s: Session, x: number, y: number) {
		s.offsetX = x - s.originRect.left;
		s.offsetY = y - s.originRect.top;
		s.overlay = createOverlay(s);
		moveOverlay(s, x, y);
		s.lastX = x;
		s.lastY = y;
		retarget(s, x, y);
		announce(
			resolveMessages().lifted(
				s.label,
				s.from.index + 1,
				(s.itemsOf.get(s.source as Container)?.length ?? 0) + 1
			)
		);
		autoScroll(s);
	}

	function trackPointer(s: Session) {
		const move = (e: PointerEvent) => {
			if (e.pointerId !== s.pointerId) return;
			e.preventDefault();
			s.lastX = e.clientX;
			s.lastY = e.clientY;
			moveOverlay(s, e.clientX, e.clientY);
			retarget(s, e.clientX, e.clientY);
		};
		const up = (e: PointerEvent) => {
			if (e.pointerId !== s.pointerId) return;
			finish(true);
		};
		const cancel = (e: PointerEvent) => {
			if (e.pointerId !== s.pointerId) return;
			finish(false);
		};
		const key = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				finish(false);
			}
		};
		// Touch: once dragging, the page must not scroll under the finger.
		const block = (e: TouchEvent) => e.cancelable && e.preventDefault();
		document.addEventListener("pointermove", move, { passive: false });
		document.addEventListener("pointerup", up);
		document.addEventListener("pointercancel", cancel);
		document.addEventListener("keydown", key, true);
		document.addEventListener("touchmove", block, { passive: false });
		cleanups.push(() => {
			document.removeEventListener("pointermove", move);
			document.removeEventListener("pointerup", up);
			document.removeEventListener("pointercancel", cancel);
			document.removeEventListener("keydown", key, true);
			document.removeEventListener("touchmove", block);
		});
	}

	function armPointer(e: PointerEvent, itemEl: HTMLElement, make: () => Session | null) {
		if (session || e.button > 0 || !e.isPrimary) return;
		const touch = e.pointerType === "touch";
		const startX = e.clientX;
		const startY = e.clientY;
		const pointerId = e.pointerId;
		let timer = 0;
		const disarm = () => {
			clearTimeout(timer);
			document.removeEventListener("pointermove", pre);
			document.removeEventListener("pointerup", disarm);
			document.removeEventListener("pointercancel", disarm);
			itemEl.removeAttribute("data-dnd-pressing");
		};
		const go = (x: number, y: number) => {
			disarm();
			const s = make();
			if (!s) return;
			s.pointerId = pointerId;
			startPointerDrag(s, x, y);
			trackPointer(s);
			// A click right after the drag must not activate the item.
			const swallow = (ev: Event) => ev.stopPropagation();
			itemEl.addEventListener("click", swallow, { capture: true, once: true });
			setTimeout(() => itemEl.removeEventListener("click", swallow, true), 0);
		};
		const pre = (ev: PointerEvent) => {
			if (ev.pointerId !== pointerId) return;
			const dx = ev.clientX - startX;
			const dy = ev.clientY - startY;
			if (touch) {
				// Moving before the hold ends is a scroll or a swipe: give up.
				if (Math.hypot(dx, dy) > 8) disarm();
				return;
			}
			if (Math.hypot(dx, dy) >= threshold) go(ev.clientX, ev.clientY);
		};
		document.addEventListener("pointermove", pre);
		document.addEventListener("pointerup", disarm);
		document.addEventListener("pointercancel", disarm);
		if (touch) {
			itemEl.setAttribute("data-dnd-pressing", "");
			timer = window.setTimeout(() => go(startX, startY), holdMs);
		}
	}

	// ── keyboard drag ──────────────────────────────────────────────────────────

	function keyboardDrag(s: Session, handleEl: HTMLElement) {
		s.handleEl = handleEl;
		const key = (e: KeyboardEvent) => {
			if (session !== s) return;
			const t = s.target;
			const c = t?.container ?? s.source;
			if (!c) return;
			const horizontal = c.sort?.axis === "x";
			const next = horizontal ? "ArrowRight" : "ArrowDown";
			const prev = horizontal ? "ArrowLeft" : "ArrowUp";
			const cross = horizontal ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
			if (e.key === "Escape") {
				e.preventDefault();
				e.stopPropagation();
				finish(false);
				handleEl.focus();
				return;
			}
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				e.stopPropagation();
				finish(true);
				handleEl.focus();
				return;
			}
			if (e.key === "Tab") {
				finish(false);
				return;
			}
			let nextTarget: Session["target"] | undefined;
			const list = s.slots.get(c) ?? [];
			if (e.key === next && c.kind === "sort") {
				nextTarget = { container: c, index: Math.min(list.length, (t?.index ?? 0) + 1) };
			} else if (e.key === prev && c.kind === "sort") {
				nextTarget = { container: c, index: Math.max(0, (t?.index ?? 0) - 1) };
			} else if (e.key === "Home" && c.kind === "sort") nextTarget = { container: c, index: 0 };
			else if (e.key === "End" && c.kind === "sort")
				nextTarget = { container: c, index: list.length };
			else if (cross.includes(e.key) || (c.kind === "zone" && (e.key === next || e.key === prev))) {
				const forward = e.key === "ArrowRight" || e.key === "ArrowDown";
				const order = Array.from(s.slots.keys()).sort((a, b) => {
					const ra = a.node.getBoundingClientRect();
					const rb = b.node.getBoundingClientRect();
					return ra.top - rb.top || ra.left - rb.left;
				});
				const i = order.indexOf(c);
				const to = order[i + (forward ? 1 : -1)];
				if (to) {
					const keep = Math.min(t?.index ?? 0, s.slots.get(to)?.length ?? 0);
					nextTarget = { container: to, index: to.kind === "zone" ? 0 : keep };
				}
			} else return;
			e.preventDefault();
			e.stopPropagation();
			if (!nextTarget) return;
			setTarget(s, nextTarget);
			const slot =
				nextTarget.container.kind === "sort"
					? ((s.slots.get(nextTarget.container) ?? [])[nextTarget.index] ??
						(s.slots.get(nextTarget.container) ?? []).at(-1))
					: null;
			slot?.el.scrollIntoView({ block: "nearest", inline: "nearest" });
			// The overlay of a keyboard drag is the indicator line: it does not leave the list.
			sayMoved(s);
		};
		const blur = () => {
			// Focus left the handle for something that is not the drop: treat as cancel.
			if (session === s) finish(false);
		};
		document.addEventListener("keydown", key, true);
		handleEl.addEventListener("blur", blur);
		cleanups.push(() => {
			document.removeEventListener("keydown", key, true);
			handleEl.removeEventListener("blur", blur);
		});
	}

	function liftWithKeyboard(
		id: string,
		data: unknown,
		source: Container | null,
		itemEl: HTMLElement,
		handleEl: HTMLElement,
		handleSelector: string,
		label?: string
	) {
		const s = begin(id, data, source, itemEl, "keyboard", -1, label);
		if (!s) return;
		s.handleSelector = handleEl === itemEl ? "" : handleSelector;
		announce(
			resolveMessages().lifted(
				s.label,
				s.from.index + 1,
				(s.itemsOf.get(source as Container)?.length ?? 0) + 1
			)
		);
		placeIndicator(s);
		keyboardDrag(s, handleEl);
	}

	// ── registration ───────────────────────────────────────────────────────────

	function itemOf(c: Container, target: EventTarget | null): HTMLElement | null {
		if (!(target instanceof Element)) return null;
		const el = target.closest<HTMLElement>(`[${ATTR_ITEM}]`);
		return el && c.node.contains(el) && el.closest("[data-dnd-container]") === c.node ? el : null;
	}

	function viaHandle(el: HTMLElement, target: EventTarget | null, handle?: string): boolean {
		if (!handle) return true;
		return (
			target instanceof Element && !!target.closest(handle) && el.contains(target.closest(handle))
		);
	}

	function sortable(node: HTMLElement, o: SortableOptions): DndHandle<SortableOptions> {
		let opts = o;
		const c: Container = {
			node,
			kind: "sort",
			id: o.id,
			group: o.group,
			label: o.label ?? o.id,
			sort: o,
		};
		containers.add(c);
		node.setAttribute("data-dnd-container", o.id);

		const down = (e: PointerEvent) => {
			if (opts.disabled) return;
			const el = itemOf(c, e.target);
			if (!el || !viaHandle(el, e.target, opts.handle)) return;
			if (
				(e.target as Element).closest("input, textarea, select, [contenteditable='true']") &&
				!opts.handle
			)
				return;
			armPointer(e, el, () =>
				begin(el.getAttribute(ATTR_ITEM) as string, undefined, c, el, "pointer", e.pointerId)
			);
		};
		const keydown = (e: KeyboardEvent) => {
			if (opts.disabled || session || (e.key !== " " && e.key !== "Enter")) return;
			const el = itemOf(c, e.target);
			if (!el) return;
			const focused = e.target as HTMLElement;
			// Space/Enter on an inner control (an input, a link) keeps its own meaning unless it is the handle.
			if (
				opts.handle
					? !focused.matches(opts.handle)
					: focused !== el && !focused.matches("button, [role=button]")
			)
				return;
			e.preventDefault();
			liftWithKeyboard(
				el.getAttribute(ATTR_ITEM) as string,
				undefined,
				c,
				el,
				focused,
				opts.handle ?? "button, [role=button]"
			);
		};
		const ctx = (e: Event) => {
			if (session) e.preventDefault();
		};
		node.addEventListener("pointerdown", down);
		node.addEventListener("keydown", keydown);
		node.addEventListener("contextmenu", ctx);
		return Object.assign(
			() => {
				containers.delete(c);
				node.removeAttribute("data-dnd-container");
				node.removeEventListener("pointerdown", down);
				node.removeEventListener("keydown", keydown);
				node.removeEventListener("contextmenu", ctx);
			},
			{
				update(next: SortableOptions) {
					opts = next;
					c.sort = next;
					c.group = next.group;
					c.label = next.label ?? next.id;
				},
			}
		);
	}

	function draggable<T>(node: HTMLElement, o: DraggableOptions<T>): DndHandle<DraggableOptions<T>> {
		const entry: Standalone = { node, options: o as DraggableOptions<unknown> };
		standalones.add(entry);
		node.setAttribute(ATTR_ITEM, o.id);
		const down = (e: PointerEvent) => {
			const opts = entry.options;
			if (opts.disabled || !viaHandle(node, e.target, opts.handle)) return;
			armPointer(e, node, () =>
				begin(opts.id, opts.data, null, node, "pointer", e.pointerId, opts.label)
			);
		};
		const keydown = (e: KeyboardEvent) => {
			const opts = entry.options;
			if (opts.disabled || session || (e.key !== " " && e.key !== "Enter")) return;
			const focused = e.target as HTMLElement;
			if (
				opts.handle
					? !focused.matches(opts.handle)
					: focused !== node && !focused.matches("button, [role=button]")
			)
				return;
			e.preventDefault();
			liftWithKeyboard(
				opts.id,
				opts.data,
				null,
				node,
				focused,
				opts.handle ?? "button, [role=button]",
				opts.label
			);
			// A standalone has no home list: start on the first zone that accepts it.
			const s = session as Session | null;
			const first = s ? Array.from(s.slots.keys())[0] : undefined;
			if (s && first) {
				setTarget(s, { container: first, index: 0 });
				sayMoved(s);
			}
		};
		node.addEventListener("pointerdown", down);
		node.addEventListener("keydown", keydown);
		return Object.assign(
			() => {
				standalones.delete(entry);
				node.removeAttribute(ATTR_ITEM);
				node.removeEventListener("pointerdown", down);
				node.removeEventListener("keydown", keydown);
			},
			{
				update(next: DraggableOptions<T>) {
					entry.options = next as DraggableOptions<unknown>;
					node.setAttribute(ATTR_ITEM, next.id);
				},
			}
		);
	}

	function dropzone(node: HTMLElement, o: DropzoneOptions): DndHandle<DropzoneOptions> {
		const c: Container = {
			node,
			kind: "zone",
			id: o.id,
			group: o.group,
			label: o.label ?? o.id,
			zone: o,
		};
		containers.add(c);
		node.setAttribute("data-dnd-container", o.id);
		node.setAttribute("data-dnd-zone", "");
		return Object.assign(
			() => {
				containers.delete(c);
				node.removeAttribute("data-dnd-container");
				node.removeAttribute("data-dnd-zone");
			},
			{
				update(next: DropzoneOptions) {
					c.zone = next;
					c.group = next.group;
					c.label = next.label ?? next.id;
				},
			}
		);
	}

	return {
		sortable,
		draggable,
		dropzone,
		get active() {
			return session?.id ?? null;
		},
		cancel() {
			finish(false);
		},
		get messages() {
			return resolveMessages();
		},
		destroy() {
			finish(false);
			containers.clear();
			standalones.clear();
		},
	};
}

/** Move `id` per a drop event inside plain arrays: the reorder/move helper apps usually need. */
export function applyMove<T>(
	lists: Record<string, T[]>,
	e: DndDropEvent,
	key: (item: T) => string
): Record<string, T[]> {
	const from = lists[e.from.container];
	const to = lists[e.to.container];
	if (!from || !to) return lists;
	const i = from.findIndex((it) => key(it) === e.id);
	if (i < 0) return lists;
	const next: Record<string, T[]> = { ...lists };
	const [item] = from.slice(i, i + 1);
	if (e.from.container === e.to.container) {
		const copy = from.slice();
		copy.splice(i, 1);
		copy.splice(e.to.index, 0, item);
		next[e.from.container] = copy;
		return next;
	}
	next[e.from.container] = from.filter((_, n) => n !== i);
	const dest = to.slice();
	dest.splice(e.to.index, 0, item);
	next[e.to.container] = dest;
	return next;
}
