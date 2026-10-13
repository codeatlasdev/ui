/** Shared between DropdownMenu and its items so item selection can close the menu. */
export interface MenuContext {
	/** Closes the menu and returns focus to the trigger. */
	close(): void;
}

export const MENU_CONTEXT = Symbol("ca-menu");
