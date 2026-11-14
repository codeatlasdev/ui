---
"@codeatlasdev/ui": minor
---

Button and IconButton share one name for the background-less variant: `ghost`. `IconButton` takes `variant="ghost"` (it rendered nothing for it before); `"text"` is still accepted on both components as a deprecated alias of `ghost` until the next major, renders the same look (IconButton warns once in dev). `IconButton` keeps the `.ca-icon-btn--text` class for that look and adds `.ca-icon-btn--ghost`. New exported type `ButtonVariant` (`'filled' | 'glass' | 'outlined' | 'ghost'`), shared by both (`Button` adds `'destructive'`). The library's own components and demos now use `ghost`.
