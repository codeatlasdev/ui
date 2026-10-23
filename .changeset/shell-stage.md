---
"@codeatlasdev/ui": minor
---

`AppShellLayout` `stage` snippet (#343): a persistent background layer (map, canvas, video) rendered once behind the pages, so it keeps its state across route changes. The content region passes pointer events through (panels opt back in with `.ca-stage-panel`), the shell paints nothing behind it, and `stageVisible={false}` or `data-ca-stage="hidden"` on `<html>` hides and pauses it without unmounting. The shell exposes `--ca-shell-inset-top|right|bottom|left` (rail and panel, mobile header, bottom navigation and safe area). New `paintRoot` action (`@codeatlasdev/ui/actions`) makes the `<html>` background match a nested preset island.
