export interface HoverIntentOptions {
	openDelay?: number;
	closeDelay?: number;
	onOpenChange(open: boolean): void;
}

export interface HoverIntent {
	/** Pointer/focus entered trigger or content: schedule open (cancels a pending close). */
	enter(): void;
	/** Left: schedule close (cancels a pending open). */
	leave(): void;
	/** Open/close immediately, cancelling timers. */
	set(open: boolean): void;
	destroy(): void;
}

/** Delayed open/close for tooltips and submenus. */
export function createHoverIntent({
	openDelay = 0,
	closeDelay = 0,
	onOpenChange,
}: HoverIntentOptions): HoverIntent {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const schedule = (open: boolean, delay: number) => {
		clearTimeout(timer);
		if (delay <= 0) onOpenChange(open);
		else timer = setTimeout(() => onOpenChange(open), delay);
	};
	return {
		enter: () => schedule(true, openDelay),
		leave: () => schedule(false, closeDelay),
		set(open) {
			clearTimeout(timer);
			onOpenChange(open);
		},
		destroy: () => clearTimeout(timer),
	};
}
