---
"@codeatlasdev/ui": minor
---

AppShellLayout and PageFrame fit a map-first design with props and tokens only. `AppShellLayout` takes `railWidth`, `railSeparators` and `mobileHeader`: the content offset, `--ca-shell-inset-left` and the stage inset now read `--ca-rail-width` instead of a 52px constant, and `mobileHeader={false}` renders no header below 900px and sets `--ca-shell-inset-top: 0`. The rail reads `--ca-rail-item-h`, `--ca-rail-icon`, `--ca-rail-pip-w` and `--ca-rail-pip-h`. `PageFrame` reads `--ca-frame-pad-x`, `--ca-frame-pad-y` and `--ca-frame-border-width`. With `data-style="solid"` or `"flat"` the rail, the navigation panel and the header resolve to opaque fills (`--ca-glass-bg` follows the style). `NavModule.badgeTone` (`'brand' | 'error'`) colours the module badge. Defaults are unchanged.
