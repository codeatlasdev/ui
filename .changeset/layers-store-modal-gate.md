---
"@codeatlasdev/ui": minor
---

New `layers` store: `layers.modalOpen` is reactive and true while a modal layer (Dialog, AlertDialog, Drawer, Sheet) is open; `layers.blocks(trigger)` is the same but false for a trigger inside the topmost modal. `Tooltip`, `HoverCard` and `NavigationMenuItem` no longer open on pointer movement while a modal is open (unless their trigger is inside it), so a hover panel can no longer appear under a dialog. Gate your own hover or edge UI with the store.
