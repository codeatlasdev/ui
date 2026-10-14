// ─── Responsive breakpoint store (Svelte 5 runes) ────────────────────────────

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

const BREAKPOINTS: Record<Breakpoint, number> = {
	xs: 0,
	sm: 600,
	md: 900,
	lg: 1200,
	xl: 1536,
};

function createResponsiveStore() {
	// undefined on the server and on the first client render (no hydration mismatch);
	// measured by init(). Derived values treat undefined as desktop (1280).
	let width = $state<number | undefined>(undefined);
	const w = $derived(width ?? 1280);

	const current = $derived<Breakpoint>(
		w >= BREAKPOINTS.xl
			? "xl"
			: w >= BREAKPOINTS.lg
				? "lg"
				: w >= BREAKPOINTS.md
					? "md"
					: w >= BREAKPOINTS.sm
						? "sm"
						: "xs"
	);

	const up = $derived((bp: Breakpoint) => w >= BREAKPOINTS[bp]);
	const down = $derived((bp: Breakpoint) => w < BREAKPOINTS[bp]);
	const only = $derived((bp: Breakpoint) => current === bp);
	const isMobile = $derived(w < BREAKPOINTS.md);
	const isTablet = $derived(w >= BREAKPOINTS.sm && w < BREAKPOINTS.lg);
	const isDesktop = $derived(w >= BREAKPOINTS.lg);

	let teardown: (() => void) | undefined;

	/** Measures now; the resize listener attaches once. Returns cleanup. */
	function init(): () => void {
		if (typeof window === "undefined") return () => {};
		width = window.innerWidth;
		if (teardown) return teardown;
		const handler = () => {
			width = window.innerWidth;
		};
		window.addEventListener("resize", handler, { passive: true });
		teardown = () => {
			window.removeEventListener("resize", handler);
			teardown = undefined;
		};
		return teardown;
	}

	return {
		get width() {
			return width;
		},
		get current() {
			return current;
		},
		get up() {
			return up;
		},
		get down() {
			return down;
		},
		get only() {
			return only;
		},
		get isMobile() {
			return isMobile;
		},
		get isTablet() {
			return isTablet;
		},
		get isDesktop() {
			return isDesktop;
		},
		init,
		BREAKPOINTS,
	};
}

/** Reactive breakpoint store (`current`, `up`, `down`, `only`, `isMobile`, `isTablet`, `isDesktop`, `BREAKPOINTS`). SSR-safe: reads as desktop until `responsive.init()` measures the window. */
export const responsive = createResponsiveStore();
