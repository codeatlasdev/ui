---
"@codeatlasdev/ui": minor
---

Dialog, AlertDialog and Drawer read four sheet-role tokens: `--ca-sheet-bg`, `--ca-sheet-blur`, `--ca-sheet-border` and `--ca-sheet-shadow` (defaults are today's solid panel, so nothing changes). Setting them on `:root` makes all three panels glass without a selector override; `prefers-reduced-transparency` falls back to `--ca-glass-tint-solid`. New blur role `data-ca-blur="sheet"`. The unused `.glass-nav-layer` utility is removed.
