---
"@codeatlasdev/ui": patch
---

AppShellLayout: the inline restore script no longer embeds the module ids, so a nav that differs between SSR and the client (permission-gated modules) no longer logs `hydration_html_changed`. The stored module is validated after hydration.
