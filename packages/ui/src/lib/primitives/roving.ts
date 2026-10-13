export interface RovingOptions {
	/** CSS selector matching the items inside `container`. */
	selector: string;
	orientation: "horizontal" | "vertical" | "both";
	/** Wrap around at the ends. Default true. */
	loop?: boolean;
	/** Called after focus moved to `el`. */
	onMove?(el: HTMLElement): void;
}

function isDisabled(el: HTMLElement) {
	return (
		el.hasAttribute("disabled") ||
		el.getAttribute("aria-disabled") === "true" ||
		el.hasAttribute("data-disabled")
	);
}

/**
 * Roving tabindex: one item has tabindex 0, the rest -1. Arrow keys (per `orientation`),
 * Home and End move focus among enabled items; disabled ones are skipped. Returns cleanup.
 */
export function rovingFocus(container: HTMLElement, options: RovingOptions): () => void {
	const { selector, orientation, loop = true, onMove } = options;
	const rtl = () => getComputedStyle(container).direction === "rtl";

	const items = () => Array.from(container.querySelectorAll<HTMLElement>(selector));
	const enabled = () => items().filter((el) => !isDisabled(el));

	function sync(active?: HTMLElement) {
		const all = items();
		const live = all.filter((el) => !isDisabled(el));
		const current =
			active && live.includes(active)
				? active
				: (live.find((el) => el.tabIndex === 0 && el.hasAttribute("data-roving-active")) ??
					live.find(
						(el) =>
							el.getAttribute("aria-selected") === "true" ||
							el.getAttribute("aria-checked") === "true" ||
							el.hasAttribute("data-active")
					) ??
					live[0]);
		for (const el of all) {
			el.tabIndex = el === current ? 0 : -1;
			if (el === current) el.setAttribute("data-roving-active", "");
			else el.removeAttribute("data-roving-active");
		}
	}

	function move(target: HTMLElement) {
		sync(target);
		target.focus();
		onMove?.(target);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.altKey || e.ctrlKey || e.metaKey) return;
		const list = enabled();
		const from = e.target instanceof Element ? e.target.closest<HTMLElement>(selector) : null;
		if (!from || !container.contains(from) || list.length === 0) return;
		const i = list.indexOf(from);
		if (i < 0) return;

		const horizontal = orientation !== "vertical";
		const vertical = orientation !== "horizontal";
		const forwardKey = horizontal && (rtl() ? "ArrowLeft" : "ArrowRight");
		const backKey = horizontal && (rtl() ? "ArrowRight" : "ArrowLeft");
		let next: HTMLElement | undefined;
		if (e.key === forwardKey || (vertical && e.key === "ArrowDown")) {
			next = list[i + 1] ?? (loop ? list[0] : undefined);
		} else if (e.key === backKey || (vertical && e.key === "ArrowUp")) {
			next = list[i - 1] ?? (loop ? list[list.length - 1] : undefined);
		} else if (e.key === "Home") {
			next = list[0];
		} else if (e.key === "End") {
			next = list[list.length - 1];
		} else return;

		e.preventDefault();
		if (next) move(next);
	}

	function onFocusin(e: FocusEvent) {
		const el = e.target instanceof Element ? e.target.closest<HTMLElement>(selector) : null;
		if (el && container.contains(el) && !isDisabled(el)) sync(el);
	}

	sync();
	container.addEventListener("keydown", onKeydown);
	container.addEventListener("focusin", onFocusin);
	// Items come and go (and get disabled): keep exactly one tab stop.
	const mo = new MutationObserver(() => sync());
	mo.observe(container, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["disabled", "aria-disabled", "data-disabled"],
	});

	return () => {
		container.removeEventListener("keydown", onKeydown);
		container.removeEventListener("focusin", onFocusin);
		mo.disconnect();
	};
}
