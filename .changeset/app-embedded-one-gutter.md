---
"@codeatlasdev/ui": minor
---

AppSettings, AppList and AppForm take `embedded`: inside a `PageShell` they render no header of their own and no page padding, so the gutter is applied once and the content aligns with the shell's title. `Container` adds the sizes `default`, `wide` and `full` (`full` is capped at `--ca-content-max-full`, 120rem, instead of growing past 1536px); `lg` and `xl` stay as aliases. Standalone pages are unchanged.
