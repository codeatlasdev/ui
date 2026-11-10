---
"@codeatlasdev/ui": patch
---

`styles/global.css` is 54 B smaller: the seven non-default built-in preset files no longer repeat the glass edge and shadow (`--ca-glass-border`, `--ca-glass-shadow`), which are identical across presets and already carried by the default preset's `:root` and `.dark` blocks. Rendering is unchanged in every scheme and nesting; brand presets keep emitting every token.
