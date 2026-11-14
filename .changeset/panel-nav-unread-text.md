---
"@codeatlasdev/ui": patch
---

AppShell panel item: the unread badge and the "new" dot no longer name themselves with `aria-label` on a plain `span` (ARIA prohibits naming a generic element, so some screen readers read "Messages 99+" and never "unread"). Both are `aria-hidden` and the count reaches the link name as visually hidden text ("Messages 120 unread", "What's new New"). No visual change.
