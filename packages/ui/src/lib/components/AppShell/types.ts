// ─── AppShell navigation types ────────────────────────────────────────────────

export const RAIL_WIDTH = 52; // px, icon dock
export const PANEL_WIDTH = 200; // px, side panel (default)
export const PANEL_MIN_WIDTH = 160; // px, narrowest panel `panelWidth` or the resize handle can reach
export const PANEL_MAX_WIDTH = 480; // px, widest

/** `width` rounded to a whole pixel and held inside `[PANEL_MIN_WIDTH, PANEL_MAX_WIDTH]`; `PANEL_WIDTH` for a non-finite value. */
export function clampPanelWidth(width: number): number {
	if (!Number.isFinite(width)) return PANEL_WIDTH;
	return Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, Math.round(width)));
}

import type { Component, Snippet } from "svelte";
import type { IconComponent } from "../../types.js";

export interface NavItem {
	id: string;
	label: string;
	icon: IconComponent;
	path: string;
	/** Unread-style badge: announced as "N unread" and capped at 99+. For a plain total use `count`. */
	badge?: number;
	/**
	 * Neutral count shown after the label (records in a folder, items in a list). It is part of the
	 * link's name as a bare number, never "unread", and `0` renders. Large values abbreviate (`1.2k`).
	 */
	count?: number;
	/**
	 * A per-item marker: any CSS color (`#e11d48`, `var(--ca-success-main)`). Renders a decorative dot
	 * before the label, in place of the icon's position when `leading` is not set. The icon stays.
	 */
	color?: string;
	/** Replaces the icon (a color dot, an avatar, an emoji). Decorative: the label stays the name. */
	leading?: Snippet;
	/**
	 * Menu content for a "…" button at the end of the row, usually `DropdownMenuItem`s. The button is
	 * a sibling of the link (a link cannot contain a control), named "Actions for <label>", and
	 * appears on hover and focus.
	 */
	actions?: Snippet;
	isNew?: boolean;
	shortcut?: string;
	description?: string;
}

/** A drop in a reorderable list: `id` of the item that moved, from and to indexes inside `items`. */
export interface NavReorderEvent {
	id: string;
	from: number;
	to: number;
}

export interface NavSection {
	label?: string;
	collapsible?: boolean;
	defaultOpen?: boolean;
	items: NavItem[];
	/**
	 * Makes the items of this section reorderable: each row gets a grip (mouse, touch press-and-hold
	 * and keyboard through `useDnd`). Needs `reorder={NavReorder}` on `AppShellLayout` (opt-in, so the
	 * drag engine is only bundled by apps that reorder). The shell never reorders `items` itself;
	 * commit the move in your state, the new order flows back in. Not called when the drop lands where
	 * it started.
	 */
	onReorder?: (e: NavReorderEvent) => void;
}

export interface NavModule {
	id: string;
	label: string;
	icon: IconComponent;
	basePath: string;
	/** Extra URL prefixes that also activate this module in the Rail */
	pathPrefixes?: string[];
	items: (NavItem | NavSection)[];
	/** Same as `NavSection.onReorder`, for the items that sit directly in `items` (outside any section). */
	onReorder?: (e: NavReorderEvent) => void;
}

/** Props of the opt-in `NavReorder` list (see `NavExtras.reorder`). */
export interface NavReorderProps {
	items: NavItem[];
	onReorder: (e: NavReorderEvent) => void;
	label: string;
	isActive: (item: NavItem) => boolean;
}

/** Opt-in nav features passed to `AppShellLayout` (`reorder`, `itemMenu`), shared through context. */
export interface NavExtras {
	reorder?: Component<NavReorderProps>;
	itemMenu?: Component<{ label: string; actions: Snippet }>;
}

export interface SidebarState {
	panelOpen: boolean;
	pathname: string;
	setPanelOpen: (v: boolean) => void;
	togglePanel: () => void;
	navigate: (path: string) => void;
}

/** Type guard: true for a `NavSection` (a titled group of items), false for a plain `NavItem`. */
export function isNavSection(item: NavItem | NavSection): item is NavSection {
	return "items" in item && !("path" in item);
}

/** `path` without trailing slashes: `"/"` becomes `""`, so the root is the empty prefix. */
const trimmed = (path: string) => path.replace(/\/+$/, "");

/** True when `pathname` equals `prefix` or sits below it, on whole segments; trailing slashes are ignored. */
function underPath(pathname: string, prefix: string): boolean {
	const current = trimmed(pathname);
	const base = trimmed(prefix);
	return current === base || current.startsWith(`${base}/`);
}

/**
 * True when `pathname` is the item's path or sits below it; trailing slashes are ignored on both
 * sides. An item at `"/"` is active on `"/"` only, it does not claim every page.
 */
export function isItemActive(item: NavItem, pathname: string): boolean {
	// The root item is the page "/" itself; as a prefix it would cover the whole site.
	return trimmed(item.path) === "" ? trimmed(pathname) === "" : underPath(pathname, item.path);
}

/** Every navigable path of the given modules, in order, flattening sections. */
export function collectPaths(modules: NavModule[]): string[] {
	return modules.flatMap((mod) =>
		mod.items.flatMap((item) => (isNavSection(item) ? item.items.map((i) => i.path) : [item.path]))
	);
}

/**
 * Index of the module whose `basePath` or `pathPrefixes` match `pathname`; `-1` when none does.
 * Prefixes match whole path segments and the longest one wins, so a module at `basePath: "/"`
 * only gets the pages no other module claims, whatever the module order.
 */
export function matchModuleIndex(modules: NavModule[], pathname: string): number {
	let best = -1;
	let bestLength = -1;
	modules.forEach((mod, index) => {
		for (const prefix of [mod.basePath, ...(mod.pathPrefixes ?? [])]) {
			const length = trimmed(prefix).length;
			if (length > bestLength && underPath(pathname, prefix)) {
				best = index;
				bestLength = length;
			}
		}
	});
	return best;
}

/** Index of the module whose `basePath` or `pathPrefixes` match `pathname`; `0` when none does. */
export function findActiveModuleIndex(modules: NavModule[], pathname: string): number {
	return Math.max(0, matchModuleIndex(modules, pathname));
}

/** Path of the nav item that is active for `pathname`, or `null` when none matches. */
export function findActiveItemPath(modules: NavModule[], pathname: string): string | null {
	for (const mod of modules) {
		for (const entry of mod.items) {
			if (isNavSection(entry)) {
				const hit = entry.items.find((i) => isItemActive(i, pathname));
				if (hit) return hit.path;
			} else if (isItemActive(entry, pathname)) {
				return entry.path;
			}
		}
	}
	return null;
}

/** First navigable path inside a module (used by Rail/BottomNav on tap). */
export function firstModulePath(mod: NavModule): string {
	for (const entry of mod.items) {
		if (isNavSection(entry)) {
			if (entry.items.length > 0) return entry.items[0].path;
		} else {
			return entry.path;
		}
	}
	return mod.basePath;
}
