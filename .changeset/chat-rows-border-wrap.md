---
"@codeatlasdev/ui": patch
---

ConversationItem: the row button resets its own border and appearance, so an app without a global button reset no longer draws the browser 2px outset frame. MessageBubble: the body wraps with `overflow-wrap: break-word` instead of `anywhere`, so a short message in a shrinking flex item keeps its word on one line instead of one character per line, and the meta footer wraps inside the bubble.
