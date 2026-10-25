---
"@codeatlasdev/ui": patch
---

Surfaces and chips inside a `ThemeIsland` (and a `PreviewStage` with a `scheme` or `preset`) follow the island, not the page around it. The layer tokens (`--ca-overlay-bg`, `--ca-panel-bg`, `--ca-chrome-bg`, `--ca-upload-bg`) and the solid style's tint overrides are re-declared on `[data-theme-scope]`, so a dark island on a light page no longer inherits the page's resolved light surface (a `FileUpload` zone, an `AppForm` footer) under dark text. The `success`, `error`, `warning` and `info` chip text follows `[data-theme-scope]` as well as `.dark`.
