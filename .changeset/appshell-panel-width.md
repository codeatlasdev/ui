---
"@codeatlasdev/ui": minor
---

`AppShellLayout` takes `panelWidth` (px, held between 160 and 480, default 200) and `resizablePanel` (#292). The content offset and the open and close animation follow the width, so a panel for long labels no longer misaligns the page. `resizablePanel` adds a keyboard-operable drag handle on the panel's trailing edge (Arrow keys 8px, Shift 32px, Home and End for the bounds); with `persistPanel` the chosen width is stored in `ca-shell` and restored by the inline script before the first paint. New `appShell.resizePanel` message and `.ca-panel__resize` class.
