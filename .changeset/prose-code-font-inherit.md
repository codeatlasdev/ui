---
"@codeatlasdev/ui": patch
---

`.ca-prose` and `.ca-code` fences: the `code` inside a `pre` inherits the pinned `--ca-font-mono` stack instead of the browser's bare `monospace`, which Chromium could resolve to a different font (and line height) between two paints.
