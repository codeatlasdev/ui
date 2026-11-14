---
"@codeatlasdev/ui": patch
---

TabsList: a tab reached by the keyboard is no longer left clipped or under the edge fade. The strip reveals the focused tab (not only the selected one), keeps the fade width as the gutter while an edge is faded (`--ca-tabs-scroll-gutter`, default `--ca-space-8`), and no longer uses scroll snapping, which pulled the strip back to the nearest tab start after each reveal. Without `fade` the gutter stays 4px.
