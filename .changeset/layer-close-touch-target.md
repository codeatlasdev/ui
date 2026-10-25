---
"@codeatlasdev/ui": patch
---

The close button of `Dialog`, `AlertDialog`, `Drawer` and `Sheet` (`.ca-layer-close`, drawn 28px) gets the invisible 44px hit area under a coarse pointer, like every other small control. It was missing from the touch list, so an overlay measured 27 by 27 on a phone, inline overlays included.
