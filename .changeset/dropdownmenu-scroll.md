---
"@codeatlasdev/ui": patch
---

DropdownMenu: a long menu no longer grows past the screen. The panel is capped at `min(var(--ca-menu-max, 32rem), available height beside the trigger)` and scrolls inside itself (`overscroll-behavior: contain`), so the last items of a 22-item menu are reachable on a phone. Opened by pointer, it scrolls the checked (or `aria-current`) item into view without moving focus. Short menus are unchanged.
