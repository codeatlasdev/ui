---
"@codeatlasdev/ui": minor
---

New token `--ca-code-line-height` (20px): an integer px line height for code surfaces. `CodeSnippet`, `.ca-code pre` and a bare Markdown `pre` inside `.ca-prose` use it instead of the unitless 1.6 / 1.7, which rounded to a different pixel height in a text layer and in an overlay (a caret and an active-line highlight drifting apart). The `code` inside a `CodeSnippet` also pins `--ca-font-mono` now: it used the UA's bare `monospace`, resolved per lookup. The docs gain "Code surfaces: integer line-height, one font stack" for apps that build an editor.
