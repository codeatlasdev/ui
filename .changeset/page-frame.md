---
"@codeatlasdev/ui": minor
---

PageFrame: page container for map-first apps. `mode` map | split | page, `side`, `width` sm | md | lg | xl, a non-modal bottom sheet below 900px with `peek | half | full` detents (drag or keyboard), `padded`, `headerBorder` and fixed `header` / `toolbar` / `footer` slots. New `stageInsets` store (and `--ca-stage-inset-*` on `<html>`) publishes the rectangle the frame covers so the stage can keep pins and routes clear of it; `mode="page"` sets `data-ca-stage="hidden"` on `<html>` (#344).
