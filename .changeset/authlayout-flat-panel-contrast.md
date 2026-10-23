---
"@codeatlasdev/ui": patch
---

AuthLayout: on a flat panel (`panelTone="flat"`, or `auto` under the `flat` and `outlined` surface styles) `--panel-text-secondary` and `--panel-text-tertiary` are the theme's `--ca-text-secondary` and `--ca-text-hint` instead of alpha mixes of the foreground, which measured 4.39:1 and 2.4:1 in dark and 2.21:1 in light over the raised surface. The brand gradient keeps the alpha levels.
