// ─── Toast store ──────────────────────────────────────────────────────────────
import { uid } from "../utils/index.js";
export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastItem {
	id: string;
	message: string;
	variant: ToastVariant;
	duration: number; // ms; 0 = persistent
	/** How many identical calls this toast stands for (`×3`). Absent or 1 for a fresh toast. */
	count?: number;
	/** Secondary line under the message. */
	description?: string;
	/** One inline action; clicking it runs `onClick` and dismisses the toast. */
	action?: ToastAction;
}

export interface ToastAction {
	label: string;
	onClick: () => void;
}

export interface ToastOptions {
	variant?: ToastVariant;
	/** Auto-dismiss delay in ms. 0 keeps the toast until dismissed. @default 4000 */
	duration?: number;
	/** Replaces the toast with this id in place (new text, variant and timer) instead of stacking a new one. */
	id?: string;
	/** Secondary, smaller line under the message. */
	description?: string;
	/** One inline button (label + handler). Clicking it runs `onClick` and dismisses the toast. An actionable toast lasts 8000 ms unless `duration` says otherwise. */
	action?: ToastAction;
}

/** Most toasts on screen at once; the oldest is dropped past this. */
export const TOAST_MAX = 3;
const DEFAULT_DURATION = 4000;
const ACTION_DURATION = 8000;

function createToastStore() {
	let items = $state<ToastItem[]>([]);
	// Auto-dismiss timers by toast id. Replacing/removing a toast always clears its timer, so a
	// dropped toast can never remove a later one that reused its id.
	const timers = new Map<string, number>();
	// Pointer/focus pause (WCAG 2.2.1): the time left per paused toast, and the deadline of running ones.
	const paused = new Map<string, number>();
	const deadlines = new Map<string, number>();

	function disarm(id: string) {
		clearTimeout(timers.get(id));
		timers.delete(id);
		deadlines.delete(id);
	}

	function arm(id: string, duration: number) {
		disarm(id);
		if (paused.has(id)) {
			paused.set(id, duration);
			return;
		}
		if (duration > 0) {
			deadlines.set(id, Date.now() + duration);
			timers.set(id, Number(setTimeout(() => remove(id), duration)));
		}
	}

	function remove(id: string) {
		disarm(id);
		paused.delete(id);
		items = items.filter((t) => t.id !== id);
	}

	/** Stops the auto-dismiss timer (hover/focus). A no-op for persistent toasts. */
	function pause(id: string) {
		const deadline = deadlines.get(id);
		if (
			paused.has(id) ||
			(deadline === undefined && !items.some((t) => t.id === id && t.duration > 0))
		)
			return;
		paused.set(id, deadline === undefined ? 0 : Math.max(deadline - Date.now(), 0));
		disarm(id);
	}

	/** Restarts the timer with the time that was left when it was paused. */
	function resume(id: string) {
		const left = paused.get(id);
		if (left === undefined) return;
		paused.delete(id);
		arm(id, left);
	}

	function add(message: string, variant: ToastVariant, opts: ToastOptions = {}): string {
		const { description, action } = opts;
		const duration = opts.duration ?? (action ? ACTION_DURATION : DEFAULT_DURATION);
		const byId = opts.id !== undefined;
		// A toast with an action is never a repeat: each carries its own handler.
		const existing = byId
			? items.find((t) => t.id === opts.id)
			: action
				? undefined
				: items.find(
						(t) =>
							t.variant === variant &&
							t.message === message &&
							t.description === description &&
							!t.action
					);

		if (existing) {
			const count = byId ? 1 : (existing.count ?? 1) + 1;
			items = items.map((t) =>
				t === existing ? { id: t.id, message, variant, duration, count, description, action } : t
			);
			arm(existing.id, duration);
			return existing.id;
		}

		const id = opts.id ?? uid("toast");
		let next = [...items, { id, message, variant, duration, count: 1, description, action }];
		for (const dropped of next.slice(0, Math.max(0, next.length - TOAST_MAX))) {
			disarm(dropped.id);
			paused.delete(dropped.id);
		}
		next = next.slice(-TOAST_MAX);
		items = next;
		arm(id, duration);
		return id;
	}

	const shortcut = (variant: ToastVariant) => (message: string, o?: number | ToastOptions) =>
		add(message, variant, typeof o === "number" ? { duration: o } : o);

	return {
		get items() {
			return items;
		},
		remove,
		pause,
		resume,
		show: (message: string, o?: ToastOptions) => add(message, o?.variant ?? "default", o),
		success: shortcut("success"),
		error: shortcut("error"),
		warning: shortcut("warning"),
		info: shortcut("info"),
	};
}

/** Toast queue: `toast.show(message, opts)` and the `success`/`error`/`warning`/`info` shortcuts push an item, `toast.remove(id)` drops it. An identical message and variant bumps `count` and restarts the timer instead of stacking, at most 3 show at once (the oldest goes), and `{ id }` replaces a specific toast in place. `description` adds a secondary line and `action: { label, onClick }` one inline button (8 s by default). `pause(id)`/`resume(id)` hold the auto-dismiss timer while a toast is hovered or focused. Render the queue with `<Toaster />` once in the root layout. */
export const toast = createToastStore();
