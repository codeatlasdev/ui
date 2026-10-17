---
"@codeatlasdev/ui": minor
---

`Tabs` gains `variant="line"` (bare text tabs with an underline on the active one, for page headers), and `TabsList` and `TabsTrigger` forward rest attributes: `aria-label` names the tablist, `data-*`, `id` and event handlers reach the trigger button (#286). A `TabsTrigger` now points `aria-controls` at its panel only while a `TabsContent` with the same `value` is mounted, so tabs used as view switchers no longer reference missing elements.
