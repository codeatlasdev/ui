---
"@codeatlasdev/ui": patch
---

Browser chrome color sync no longer gets stuck when the page starts in the background (or WebKit pauses its frames): a timeout backs up `requestAnimationFrame`, and the color re-syncs when the tab becomes visible.
