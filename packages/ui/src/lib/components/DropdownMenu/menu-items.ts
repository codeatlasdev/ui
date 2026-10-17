/** Every role a menu item can have. */
export const MENU_ITEM_SELECTOR =
	'[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/**
 * Items that belong to `menu` itself. A submenu's layer is declared inside its trigger item (so it
 * stays in the parent's tree), which means a plain `querySelectorAll` on the parent would also
 * return the submenu's items: keep only those whose closest menu is `menu`.
 */
export function ownItems(menu: HTMLElement | null | undefined): HTMLElement[] {
	if (!menu) return [];
	return Array.from(menu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)).filter(
		(el) => el.closest('[role="menu"]') === menu
	);
}
