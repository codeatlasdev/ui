---
"@codeatlasdev/ui": minor
---

`Menubar` and `MenubarMenu` (#456): the WAI-ARIA menubar for application menus. One tab stop; Left/Right/Home/End move between bar items (disabled skipped, wraps); Enter, Space or Down open a menu on its first item, Up on its last; inside an open menu Left/Right switch to the adjacent menu, while a submenu keeps its own arrows; Escape returns focus to the bar item; hover switches menus only once one is open. Menu content is the `DropdownMenu` items unchanged. `DropdownMenu` gains `onmenukeydown`, `ontriggerkeydown` and `openFocus`.
