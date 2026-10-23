---
"@codeatlasdev/ui": patch
---

`Carousel`: the slide strip is now the focusable region (axe `scrollable-region-focusable`; arrows, Home and End work while it has focus, also when no slide holds a control), it no longer widens a flex or grid slot to the slides' width, and previous / next / dots reach the 44px touch target. `Menubar` items get the 44px hit area under a coarse pointer. `TextField` can shrink inside a grid or flex slot narrower than the input's intrinsic width (addon fields overflowed phones).
