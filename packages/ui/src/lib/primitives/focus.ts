const FOCUSABLE = [
	"a[href]",
	"area[href]",
	"button:not([disabled])",
	"input:not([disabled]):not([type=hidden])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"summary",
	"audio[controls]",
	"video[controls]",
	'[contenteditable]:not([contenteditable="false"])',
	"[tabindex]",
].join(",");

function isVisible(el: HTMLElement) {
	if (el.hidden || el.closest("[inert]")) return false;
	// checkVisibility handles display:none / visibility:hidden / content-visibility.
	return el.checkVisibility({ visibilityProperty: true });
}

/** Tabbable descendants of `node` (tabindex ≥ 0, enabled, rendered), in DOM order. */
export function focusables(node: HTMLElement): HTMLElement[] {
	return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
		(el) => el.tabIndex >= 0 && isVisible(el)
	);
}

/** Focuses the first tabbable descendant; returns it (or null when there is none). */
export function focusFirst(node: HTMLElement): HTMLElement | null {
	const el = focusables(node)[0] ?? null;
	el?.focus({ preventScroll: true });
	return el;
}

/** Active traps, oldest first: only the newest owns focus, so nested modals never fight (#138). */
const traps: HTMLElement[] = [];

export interface TrapFocusOptions {
	/** Where focus goes on activation. Default 'first'. `false` leaves focus alone. */
	initial?: HTMLElement | "first" | "container" | false;
	/** Restore focus on cleanup: `true` → the element focused before the trap, or an explicit element. Default true. */
	restore?: boolean | HTMLElement;
}

/**
 * The control the user last pressed. Safari (macOS and iOS) does not focus a button on click or
 * tap, so `document.activeElement` is `<body>` when an overlay opens from one. Restore needs the
 * opener anyway (WAI-ARIA dialog pattern; VoiceOver users would otherwise lose their place).
 */
let lastPressed: { el: HTMLElement; at: number } | null = null;
if (typeof document !== "undefined") {
	document.addEventListener(
		"pointerdown",
		(e) => {
			const el =
				e.target instanceof Element
					? e.target.closest<HTMLElement>(
							"button, a[href], [role='button'], input, select, summary, [tabindex]"
						)
					: null;
			lastPressed = el ? { el, at: performance.now() } : null;
		},
		true
	);
}

/** Element to hand focus back to: the control pressed in the last second when the browser did not focus it, else the focused element. */
export function opener(): HTMLElement | null {
	const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const pressed =
		lastPressed && performance.now() - lastPressed.at < 1000 && lastPressed.el.isConnected
			? lastPressed.el
			: null;
	// WebKit focuses the nearest focusable ANCESTOR of a tapped button (e.g. <main tabindex="-1">),
	// or nothing at all: in both cases the pressed control is the real opener.
	if (
		pressed &&
		(!active || active === document.body || (active !== pressed && active.contains(pressed)))
	)
		return pressed;
	return active && active !== document.body ? active : null;
}

/**
 * Keeps Tab / Shift+Tab inside `node` and, on cleanup, hands focus back to where it was
 * (or to the control that opened it, when the browser did not focus it).
 * Returns cleanup.
 */
export function trapFocus(node: HTMLElement, options: TrapFocusOptions = {}): () => void {
	if (typeof document === "undefined") return () => {};
	const { initial = "first", restore = true } = options;
	const previous = opener();

	// Pushed before the initial focus, or the trap below would pull that focus back.
	traps.push(node);
	const isTop = () => traps[traps.length - 1] === node;

	if (initial === "first") {
		if (!focusFirst(node)) focusContainer(node);
	} else if (initial === "container") {
		focusContainer(node);
	} else if (initial instanceof HTMLElement) {
		initial.focus({ preventScroll: true });
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key !== "Tab" || e.defaultPrevented || !isTop()) return;
		const items = focusables(node);
		if (items.length === 0) {
			e.preventDefault();
			focusContainer(node);
			return;
		}
		const first = items[0];
		const last = items[items.length - 1];
		const active = document.activeElement;
		if (e.shiftKey && (active === first || active === node || !node.contains(active))) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && (active === last || !node.contains(active))) {
			e.preventDefault();
			first.focus();
		}
	}

	// Focus that escapes (programmatic or via a non-Tab path) is pulled back in.
	function onFocusin(e: FocusEvent) {
		if (isTop() && e.target instanceof Node && !node.contains(e.target)) {
			if (!focusFirst(node)) focusContainer(node);
		}
	}

	node.addEventListener("keydown", onKeydown);
	document.addEventListener("focusin", onFocusin);

	return () => {
		node.removeEventListener("keydown", onKeydown);
		document.removeEventListener("focusin", onFocusin);
		const i = traps.lastIndexOf(node);
		if (i >= 0) traps.splice(i, 1);
		if (restore === false) return;
		const target = restore instanceof HTMLElement ? restore : previous;
		if (target?.isConnected) target.focus({ preventScroll: true });
	};
}

function focusContainer(node: HTMLElement) {
	if (node.tabIndex < 0 && !node.hasAttribute("tabindex")) node.tabIndex = -1;
	node.focus({ preventScroll: true });
}
