// ─── Chart design tokens — CSS var snapshot ───────────────────────────────────
// Reads the live design system (dark/light + 8 presets) at call time so every
// chart option is always in sync with the current theme. Internal only.

import { getContext, setContext } from "svelte";
import { colorScheme } from "../stores/color-scheme.svelte.js";

// ─── Theme scope ──────────────────────────────────────────────────────────────
// Charts are canvas: they cannot use CSS variables, so tokens are read once per option build with
// getComputedStyle. Read from `:root`, a chart inside a `data-theme-scope` / `data-preset` island
// painted the page's colors instead of the island's. A scope is the element whose computed style
// holds the tokens; `ThemeIsland` (and `ChartScope`) provide theirs by context, and every public
// chart reads it at init. No scope means `<html>`, exactly as before.

const SCOPE = Symbol("ca-chart-scope");

/** Reactive holder of the element charts read tokens from. */
export interface ChartScopeRef {
	el: HTMLElement | null;
}

/** Provide `ref` to every chart rendered below the calling component. Call during component init. */
export function setChartScope(ref: ChartScopeRef): void {
	setContext(SCOPE, ref);
}

/** The scope provided above this component, or an empty one (`el: null` = the page). Call during init. */
export function useChartScope(): ChartScopeRef {
	return getContext<ChartScopeRef | undefined>(SCOPE) ?? { el: null };
}

/**
 * CSS vars aren't reactive. Reading the scheme here makes any `$derived` that builds a chart
 * option re-run on theme/preset/style changes (the store updates the DOM synchronously first).
 */
export function trackTheme(): void {
	void colorScheme.resolved;
	void colorScheme.preset;
	void colorScheme.style;
}

function v(name: string, fallback: string, scope: Element | null): string {
	if (typeof document === "undefined") return fallback;
	trackTheme();
	return (
		getComputedStyle(scope ?? document.documentElement)
			.getPropertyValue(name)
			.trim() || fallback
	);
}

export interface ChartTokens {
	brand: string;
	brandLight: string;
	textPrimary: string;
	textSecondary: string;
	textDisabled: string;
	success: string;
	error: string;
	warning: string;
	info: string;
	glassBg: string;
	glassBorder: string;
	glassShadow: string;
	blur: string;
	outlineSubtle: string;
	actionHover: string;
	radiusMd: string;
	radiusLg: string;
	fontSans: string;
}

/** Token snapshot read from `scope` (an island) or, without one, from `<html>`. */
export function chartTokens(scope: Element | null = null): ChartTokens {
	return {
		brand: v("--ca-brand-main", "#f59e0b", scope),
		brandLight: v("--ca-brand-light", "#fcd34d", scope),
		textPrimary: v("--ca-text-primary", "#0f172a", scope),
		textSecondary: v("--ca-text-secondary", "#475569", scope),
		textDisabled: v("--ca-text-disabled", "#94a3b8", scope),
		success: v("--ca-semantic-success", "#22c55e", scope),
		error: v("--ca-semantic-error", "#ef4444", scope),
		warning: v("--ca-semantic-warning", "#f59e0b", scope),
		info: v("--ca-semantic-info", "#3b82f6", scope),
		glassBg: v("--ca-glass-bg", "rgba(255,255,255,0.55)", scope),
		glassBorder: v("--ca-glass-border", "rgba(255,255,255,0.25)", scope),
		glassShadow: v("--ca-glass-shadow", "0 8px 32px rgba(0,0,0,0.12)", scope),
		blur: v("--ca-blur-regular", "blur(16px)", scope),
		outlineSubtle: v("--ca-outline-subtle", "rgba(0,0,0,0.07)", scope),
		actionHover: v("--ca-action-hover", "rgba(0,0,0,0.04)", scope),
		radiusMd: v("--ca-radius-md", "12px", scope),
		radiusLg: v("--ca-radius-lg", "16px", scope),
		fontSans: v(
			"--ca-font-sans",
			"Inter,system-ui,-apple-system,BlinkMacSystemFont,sans-serif",
			scope
		),
	};
}

/** Resolve a semantic zone color name (or pass-through a raw CSS color). */
export function resolveZoneColor(name: string, t: ChartTokens = chartTokens()): string {
	switch (name) {
		case "success":
			return t.success;
		case "warning":
			return t.warning;
		case "error":
			return t.error;
		case "info":
			return t.info;
		case "brand":
			return t.brand;
		default:
			return name;
	}
}
