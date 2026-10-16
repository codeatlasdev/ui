---
"@codeatlasdev/ui": minor
---

Every backdrop blur now comes from one place. Components no longer declare `backdrop-filter`: they set `data-ca-blur="<role>"` (or are a `.ca-surface`) and `styles/surface.css` paints it from the tokens `<html data-style>` rewrites, so one attribute turns every blur off or down together. The look is unchanged (guarded by a computed-style test over 9 styles, light and dark). `FloatingLayer` gains a `blur` prop (`overlay` or `tooltip`). `lint:tokens` rejects `backdrop-filter` outside `surface.css` and `materials.css`. The MCP server gains `list_surfaces`, generated from the `[data-style]` selectors in `materials.css`, and `dist/surfaces.json` ships with the package.
