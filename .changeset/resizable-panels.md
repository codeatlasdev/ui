---
"@codeatlasdev/ui": minor
---

`ResizablePanels`, `ResizablePanel` and `ResizableHandle` (#444, part of #432): panels split by WAI-ARIA window splitters. Sizes are percentages that add up to 100; a handle trades only with its two neighbours and stops at each panel's `minSize` / `maxSize`. Arrow keys move 1%, Shift 10%, Home and End go to the limits (Up and Down in a `direction="vertical"` group, mirrored in RTL). `persist` keeps the layout in `localStorage` and ignores a stored layout that does not match the panels; `onlayout` reports it. Replaces `react-resizable-panels` / shadcn `Resizable`. New i18n group `resizablePanels` (en, pt-BR).
