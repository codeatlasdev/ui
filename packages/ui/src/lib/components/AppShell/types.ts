// ─── AppShell navigation types ────────────────────────────────────────────────

export const RAIL_WIDTH = 52; // px, icon dock
export const PANEL_WIDTH = 200; // px, side panel

import type { IconComponent } from "../../types.js";

export interface NavItem {
	id: string;
	label: string;
	icon: IconComponent;
	path: string;
	badge?: number;
	isNew?: boolean;
	shortcut?: string;
	description?: string;
}

export interface NavSection {
	label?: string;
	collapsible?: boolean;
	defaultOpen?: boolean;
	items: NavItem[];
}

export interface NavModule {
	id: string;
	label: string;
	icon: IconComponent;
	basePath: string;
	/** Extra URL prefixes that also activate this module in the Rail */
	pathPrefixes?: string[];
	items: (NavItem | NavSection)[];
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
