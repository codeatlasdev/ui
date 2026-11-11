---
"@codeatlasdev/ui": minor
---

`Toolbar` takes `overflow?: "wrap" | "scroll" | "menu"` (default `"wrap"`, today's behaviour) and `moreLabel`. `scroll` keeps one line and scrolls sideways with no scrollbar; `menu` keeps one line and moves the items that do not fit into a localized "More" `DropdownMenu` (measured with a `ResizeObserver`, re-measured on resize and font load). An item with `data-priority="primary"` never moves; `data-overflow="Label"` names its menu entry. `ButtonGroup` gets `min-width: 0` so it shrinks inside a row. New `ca-toolbar__more`, `data-overflow`, `data-overflowed`, `data-priority` hooks (see `docs/css-api.md`); i18n `toolbar.more` in en and pt-BR.
