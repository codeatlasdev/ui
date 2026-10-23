---
"@codeatlasdev/ui": patch
---

`NotificationBell`: the trigger's accessible name now starts with the visible unread count (`2 unread notifications` / `2 notificações não lidas`, plain `Notifications` at zero), so it contains the visible badge text (WCAG 2.5.3, axe `label-content-name-mismatch`). Custom `notificationBell.label` overrides should keep the count in the name.
