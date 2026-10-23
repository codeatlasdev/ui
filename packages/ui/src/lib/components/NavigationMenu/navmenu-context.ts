/** Shared between a `NavigationMenu` and its items: which panel is open and the hover timing. */
export interface NavMenuContext {
	/** Id of the open panel, or null. */
	readonly openId: string | null;
	/** Opens `id` now (closing any other) or closes everything with null. */
	set(id: string | null): void;
	/** Pointer on an item's button: opens after the open delay, or at once when a panel is already open. */
	enter(id: string): void;
	/** Pointer left an item's button or its panel: closes after the close delay. */
	leave(): void;
	/** Pointer entered the open panel: cancels a pending close. */
	keep(): void;
}

export const NAVMENU_CONTEXT = Symbol("ca-navmenu");

/** Set by a `NavigationMenuItem` around its panel content: a link inside it is a panel link, not a top-level entry. */
export const NAVMENU_PANEL_CONTEXT = Symbol("ca-navmenu-panel");
