---
"@codeatlasdev/ui": patch
---

A closing `Dialog`, `AlertDialog`, `Drawer`, `Sheet`, `Lightbox` or `CommandPalette` no longer keeps the page inert for its exit animation: as soon as `open` turns false the panel stops being modal (`inert`, `pointer-events: none`, scroll unlocked), so a button revealed by the same change is clickable at once. If the opener was removed during the exit, focus goes to its nearest focusable ancestor, else `#main`, instead of `<body>`. `LayerHandle` gains an optional `release()` for this.
