---
"@codeatlasdev/ui": patch
---

The Settings page recipe no longer tells a `Switch` inside a `SettingItem` to carry its own `aria-label`: the row is a `<label>` and already names it (as the SettingItem page says), so the redundant attribute and the rule are gone.
