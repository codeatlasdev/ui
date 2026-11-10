---
"@codeatlasdev/ui": patch
---

`Tooltip` and `HoverCard` close when the window loses focus or the page becomes hidden (Cmd-Tab, another Space, minimize, a webview losing activation). Neither delivers `pointerleave` or `blur` to the trigger, so the hint used to be on screen when the user came back. `FloatingLayer` reports it to hint layers as `onDismiss('window')`; popovers and menus stay open, since they can hold a form.
