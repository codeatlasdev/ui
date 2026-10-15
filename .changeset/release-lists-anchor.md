---
"@codeatlasdev/ui": patch
---

`.ca-prose` heading anchors stay visible on touch screens: a stray second `@media (hover: none)` block hid them with `display: none`, contradicting the rule above it. New "Release lists" docs page documents the `ca-release*` markup and the version-id anchor convention.
