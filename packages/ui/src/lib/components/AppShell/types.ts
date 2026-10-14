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

/** True when `pathname` is the item's path or sits below it; trailing slashes are ignored on both sides. */
export function isItemActive(item: NavItem, pathname: string): boolean {
	// Works with or without trailing slashes on either side ("/users" vs "/users/").
	const path = item.path.replace(/\/+$/, "");
	const current = pathname.replace(/\/+$/, "");
	return current === path || current.startsWith(`${path}/`);
}

/** Every navigable path of the given modules, in order, flattening sections. */
export function collectPaths(modules: NavModule[]): string[] {
	return modules.flatMap((mod) =>
		mod.items.flatMap((item) => (isNavSection(item) ? item.items.map((i) => i.path) : [item.path]))
	);
}

/** Index of the module whose `basePath` or `pathPrefixes` match `pathname`; `0` when none does. */
export function findActiveModuleIndex(modules: NavModule[], pathname: string): number {
	const idx = modules.findIndex(
		(mod) =>
			pathname.startsWith(mod.basePath) ||
			(mod.pathPrefixes?.some((p) => pathname.startsWith(p)) ?? false)
	);
	return idx === -1 ? 0 : idx;
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
