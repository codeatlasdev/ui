// ─── Toast store ──────────────────────────────────────────────────────────────
import { uid } from "../utils/index.js";
export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastItem {
	id: string;
	message: string;
	variant: ToastVariant;
	duration: number; // ms; 0 = persistent
}

function createToastStore() {
	let items = $state<ToastItem[]>([]);

	function add(message: string, variant: ToastVariant = "default", duration = 4000): string {
		const id = uid("toast");
		items = [...items, { id, message, variant, duration }];
		if (duration > 0) setTimeout(() => remove(id), duration);
		return id;
	}

	function remove(id: string) {
		items = items.filter((t) => t.id !== id);
	}

	return {
		get items() {
			return items;
		},
		remove,
		show: (message: string, opts?: { variant?: ToastVariant; duration?: number }) =>
			add(message, opts?.variant, opts?.duration),
		success: (message: string, duration?: number) => add(message, "success", duration),
		error: (message: string, duration?: number) => add(message, "error", duration),
		warning: (message: string, duration?: number) => add(message, "warning", duration),
		info: (message: string, duration?: number) => add(message, "info", duration),
	};
}

/** Toast queue: `toast.show(message, opts)` and the `success`/`error`/`warning`/`info` shortcuts push an item, `toast.remove(id)` drops it. Render the queue with `<Toaster />` once in the root layout. */
export const toast = createToastStore();
