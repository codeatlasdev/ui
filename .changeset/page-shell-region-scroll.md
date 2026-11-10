---
"@codeatlasdev/ui": patch
---

`PageShell` inside `AppShellLayout`: the full-width content region scrolls, so the scrollbar sits at the window edge instead of beside the centred column. `.ca-shell__content` is now `position: relative`, which contains absolutely positioned descendants (a visually hidden `RecordCell` label, a native `Checkbox` input) that used the initial containing block and added a second, document-level scrollbar that scrolled the whole shell. A `PageShell` outside a shell still scrolls itself.
