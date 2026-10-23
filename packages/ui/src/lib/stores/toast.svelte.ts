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
}

export interface ToastOptions {
	variant?: ToastVariant;
	/** Auto-dismiss delay in ms. 0 keeps the toast until dismissed. @default 4000 */
	duration?: number;
	/** Replaces the toast with this id in place (new text, variant and timer) instead of stacking a new one. */
	id?: string;
}

/** Most toasts on screen at once; the oldest is dropped past this. */
export const TOAST_MAX = 3;
const DEFAULT_DURATION = 4000;

function createToastStore() {
	let items = $state<ToastItem[]>([]);
	// Auto-dismiss timers by toast id. Replacing/removing a toast always clears its timer, so a
	// dropped toast can never remove a later one that reused its id.
	const timers = new Map<string, number>();

	function arm(id: string, duration: number) {
		clearTimeout(timers.get(id));
		timers.delete(id);
		if (duration > 0) timers.set(id, Number(setTimeout(() => remove(id), duration)));
	}

	function remove(id: string) {
		clearTimeout(timers.get(id));
		timers.delete(id);
		items = items.filter((t) => t.id !== id);
	}

	function add(message: string, variant: ToastVariant, opts: ToastOptions = {}): string {
		const duration = opts.duration ?? DEFAULT_DURATION;
		const byId = opts.id !== undefined;
		const existing = byId
			? items.find((t) => t.id === opts.id)
			: items.find((t) => t.variant === variant && t.message === message);

		if (existing) {
			const count = byId ? 1 : (existing.count ?? 1) + 1;
			items = items.map((t) => (t === existing ? { ...t, message, variant, duration, count } : t));
			arm(existing.id, duration);
			return existing.id;
		}

		const id = opts.id ?? uid("toast");
		let next = [...items, { id, message, variant, duration, count: 1 }];
		for (const dropped of next.slice(0, Math.max(0, next.length - TOAST_MAX))) {
			clearTimeout(timers.get(dropped.id));
			timers.delete(dropped.id);
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
		show: (message: string, o?: ToastOptions) => add(message, o?.variant ?? "default", o),
		success: shortcut("success"),
		error: shortcut("error"),
		warning: shortcut("warning"),
		info: shortcut("info"),
	};
}

/** Toast queue: `toast.show(message, opts)` and the `success`/`error`/`warning`/`info` shortcuts push an item, `toast.remove(id)` drops it. An identical message and variant bumps `count` and restarts the timer instead of stacking, at most 3 show at once (the oldest goes), and `{ id }` replaces a specific toast in place. Render the queue with `<Toaster />` once in the root layout. */
export const toast = createToastStore();
