---
"@codeatlasdev/ui": patch
---

`AppShellLayout`: only the most specific nav item is active. With items at `/items` and `/items/a`, visiting `/items/a` marks just `Item A` (`aria-current`, active style, section auto-open) and the mobile header title is its label, no longer the overview's. Same rule as modules: longest path wins whatever the order. The overview item stays active on its other sub-paths. `findActiveItemPath` follows it and the new `findActiveItem(entries, pathname)` returns the item itself.
