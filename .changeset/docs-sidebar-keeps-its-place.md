---
"@codeatlasdev/ui": patch
---

DocsShell: the sidebar keeps its place between pages. On a static docs site every sidebar link loads a new document, and the sidebar used to jump back to the top, hiding the page just picked (#99). The scroll position is now saved per section in `sessionStorage` (on a sidebar click and on `pagehide`) and restored by an inline script emitted right after the sidebar, before the first paint; the current page is scrolled into the sidebar's view when it is outside it. Only the sidebar scrolls: the window and focus are untouched. Client-only mounts and pages whose CSP blocks inline scripts get the same restore on hydration.
