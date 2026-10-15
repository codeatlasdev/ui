---
"@codeatlasdev/ui": minor
---

Unified layer engine. Dialog, AlertDialog, Sheet, Drawer, Lightbox, CommandPalette, DocsSearch, DropdownMenu, Popover, Tooltip, Select, Combobox, NotificationBell and the date pickers now share one layer stack (`primitives/layer.ts`).

- Modals are native `<dialog>` + `showModal()`; menus, popovers and tooltips are `popover` elements. Both live in the top layer, so stacking no longer depends on `z-index`: a menu inside a dialog is always on top. The `--ca-z-dropdown` and `--ca-z-tooltip` tokens remain for your own in-flow UI but are no longer used by overlays.
- Anchored layers use CSS anchor positioning when supported and Floating UI otherwise.
- One Escape / outside-press / focus stack: only the topmost layer reacts, so nested overlays dismiss in order. Focus returns to the trigger on close.
- New `onLayerChange(listener)` (and a `layerchange` `CustomEvent` on `document`) fires on every layer open and close with the open layers and their rectangles, so hosts can park or snapshot native views.
- The `.ca-floating` wrapper `div` is gone: `.ca-floating` is now on the layer element itself (the one carrying `data-state`/`data-side`), and `.ca-date__float` was removed.
