---
"@codeatlasdev/ui": patch
---

DropdownMenu, DataTable column toggle (and any `FloatingLayer` consumer): closing before the frame-delayed focus move ran no longer lets that move steal focus back from the trigger. `FloatingLayer`'s `onMounted` may now return a cleanup that runs on close/unmount.
