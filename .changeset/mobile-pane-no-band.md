---
"@codeatlasdev/ui": patch
---

MobilePane: the dialog no longer scrolls (`overflow: clip`), so the header stays at the top on iOS instead of leaving an empty band above it. MobileHeader `titleSlot` children may shrink, so long custom titles truncate.
