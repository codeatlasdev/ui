---
"@codeatlasdev/ui": minor
---

`DropdownMenu` gains submenus. `DropdownMenuSub` takes a `trigger` snippet holding a `DropdownMenuSubTrigger` item (`aria-haspopup="menu"`, `aria-expanded`, chevron) and the submenu items as children; they nest to any depth. ArrowRight, Enter or Space opens the submenu on its first item, ArrowLeft or Escape closes only that level, hovering the trigger opens it after a short intent delay and the pointer can cross into it. Selecting an item closes every level. A popover layer that is closing no longer owns Escape or outside presses, so a closing submenu hands them to its parent.
