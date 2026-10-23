/** Shared between a `Menubar` and its `MenubarMenu`s: which menu is open, and moving between them. */
export interface MenubarContext {
	/** Id of the open menu, or null. */
	readonly openId: string | null;
	/** Opens `id` (closing any other) or closes everything with null. */
	setOpen(id: string | null): void;
	/** Moves from the menu `from` to the previous/next enabled one: opens it if a menu is open, else only focuses its bar item. */
	move(from: string, dir: 1 | -1 | "first" | "last", open: boolean): void;
}

export const MENUBAR_CONTEXT = Symbol("ca-menubar");
