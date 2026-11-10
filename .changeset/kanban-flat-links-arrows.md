---
"@codeatlasdev/ui": minor
---

`Kanban`: `variant="flat"` (no column panel), `cardChrome="none"` (the card snippet owns its box), `cardHref` (the card body is an `<a href>`: no nested interactive control, Enter follows the link, Space lifts), the `--ca-kanban-col-width` and `--ca-kanban-gap` tokens, and arrow-key navigation between cards (Up/Down inside a column, Left/Right to the same position of the neighbouring column) while nothing is lifted. `data-kanban-column` and `data-card-id` are documented as stable hooks. `useDnd().sortable` gains `liftKeys` (default Space and Enter).
