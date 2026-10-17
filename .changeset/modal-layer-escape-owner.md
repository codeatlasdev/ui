---
"@codeatlasdev/ui": patch
---

Fix Escape going to the wrong layer. A Dialog, AlertDialog, Drawer, Sheet, Lightbox, CommandPalette or DocsSearch that is playing its exit animation no longer takes Escape or presses: they reach the layer below, so closing a confirm dialog and pressing Escape right after closes the Drawer under it (#288). A menu or popover that was open when a modal opened now ranks above that modal, so Escape closes the menu first and the dialog second instead of closing the dialog and leaving the menu open (#299). Exit animations of components that use `createPresence` (Dialog, Drawer, AlertDialog, menus, popovers) now keep the node mounted through the exit instead of removing it in the flush that closes it, and a menu hosted in a dialog is no longer left stranded after its exit.
