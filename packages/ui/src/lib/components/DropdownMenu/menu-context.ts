/** Shared between DropdownMenu (or a submenu) and its items so item selection can close the menu. */
export interface MenuContext {
	/** Closes this menu level and returns focus to its trigger. */
	close(): void;
	/** Closes every level (root and all open submenus) and returns focus to the root trigger. */
	closeAll(): void;
}

export const MENU_CONTEXT = Symbol("ca-menu");

/** Shared between a `DropdownMenuRadioGroup` and its `DropdownMenuRadioItem`s. */
export interface RadioGroupContext {
	readonly value: string | undefined;
	select(value: string): void;
}

export const RADIO_GROUP_CONTEXT = Symbol("ca-menu-radio-group");

/** Provided by `DropdownMenuSub` to its `DropdownMenuSubTrigger`. */
export interface SubMenuContext {
	readonly open: boolean;
	readonly disabled: boolean;
	/** Id of the submenu layer, for `aria-controls`. */
	readonly contentId: string;
	/** Id given to the trigger item, for the submenu's `aria-labelledby`. */
	readonly triggerId: string;
	/** Registers the trigger element as the anchor of the submenu layer. */
	setAnchor(el: HTMLElement | null): void;
	/** Open now. `focus` picks what receives focus inside (keyboard: first item). */
	show(focus: "first" | "none"): void;
	/** Close now, focus goes back to the trigger. */
	hide(): void;
	/** Pointer entered/left the trigger: opens or closes after a short delay. */
	hoverEnter(): void;
	hoverLeave(): void;
}

export const SUB_MENU_CONTEXT = Symbol("ca-menu-sub");
