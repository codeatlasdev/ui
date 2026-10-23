---
"@codeatlasdev/ui": minor
---

`ContextMenu` (#455): wraps a region and opens a `DropdownMenu` at the pointer on right-click (a second one moves it), at the finger on a touch long-press (`longPressDelay`, default 500 ms, cancelled by lifting early or dragging) and from the keyboard with Shift+F10 or the ContextMenu key. The `menu` snippet takes the same items as `DropdownMenu` (items, checkbox and radio items, submenus, labels, separators). Text fields keep the browser's menu; `disabled` keeps it everywhere; `bind:open`, `onOpenChange`, `focusable`, `menuClass`.
