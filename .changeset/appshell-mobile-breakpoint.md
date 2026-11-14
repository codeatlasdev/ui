---
"@codeatlasdev/ui": minor
---

AppShellLayout: `mobileBreakpoint` moves the switch between the rail and the bottom navigation (`mobileBreakpoint={768}`: rail from 768px up). The shell then marks its root `data-ca-shell="mobile|desktop"`, and the Toaster lifts above the bottom navigation by that attribute. Without the prop nothing changes: the switch is the static 900px media query, painted before any JS (#1172).
