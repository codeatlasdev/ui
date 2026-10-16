---
"@codeatlasdev/ui": patch
---

`AppShellLayout`: an item at `path: "/"` is active on `/` only, no longer on every page, and a module at `basePath: "/"` only gets the pages no other module claims. Module prefixes (`basePath`, `pathPrefixes`) match whole path segments and the longest one wins, whatever the module order (`/settingsfoo` no longer matches `/settings`).
