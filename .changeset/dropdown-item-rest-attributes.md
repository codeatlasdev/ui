---
"@codeatlasdev/ui": patch
---

`DropdownMenuItem` forwards its remaining attributes (`data-*`, `id`, `aria-*`, `title`, ...) to the `menuitem` element. `data-testid` and `aria-keyshortcuts` used to be dropped. `role`, `tabindex` and the selection handler stay owned by the item.
