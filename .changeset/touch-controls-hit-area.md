---
"@codeatlasdev/ui": patch
---

Checkbox, Switch and RadioGroup: on touch screens (`pointer: coarse`) a tap on the box toggles the control again. The 44px hit-area overlay painted over the native input and swallowed the tap; the native input now is the 44px hit area.
