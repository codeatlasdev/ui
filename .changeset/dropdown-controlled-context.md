---
"@codeatlasdev/ui": minor
---

`DropdownMenu` is controllable and can open at a point. `bind:open` and `onOpenChange` read and set the open state; `anchor={{ x, y }}` opens the menu at a viewport point (a right-click menu, no `trigger` needed) and changing it while open moves the menu instead of toggling it. A menu opened from code starts on its first item and returns focus to the element that had it. On the built-in trigger Shift+F10 and the ContextMenu key open the menu like ArrowDown.
