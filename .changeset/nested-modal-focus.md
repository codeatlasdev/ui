---
"@codeatlasdev/ui": patch
---

Nested modals: only the newest focus trap owns focus, so opening a `Dialog`/`AlertDialog`/`Sheet`/`Drawer` over another no longer loops on `focusin` (`Maximum call stack size exceeded`); closing it hands focus back to the one below.
