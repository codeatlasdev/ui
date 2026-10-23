---
"@codeatlasdev/ui": patch
---

Theme: `--ca-font-size-body1` no longer sets the root font-size. `:root` keeps the user-agent size (so user font settings and every `rem` token keep their meaning) and body1 only sizes the text on `body`. A 14px body (`--ca-font-size-body1: 0.875rem`) no longer shrinks labels, inputs, buttons and captions by 12.5% (#351).
