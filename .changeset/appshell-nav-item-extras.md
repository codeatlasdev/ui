---
"@codeatlasdev/ui": minor
---

`NavItem` in the AppShell panel gets `color` (a decorative dot), `leading` (a snippet that replaces the icon), `count` (a neutral total, announced as a bare number instead of "N unread", `1.2k` above 999) and `actions` (a snippet of `DropdownMenuItem`s behind a "…" button named "Actions for <label>") (#275). `NavSection.onReorder` and `NavModule.onReorder` make the rows reorderable with the `useDnd` primitive: a grip per row, mouse, touch press-and-hold and keyboard, with announcements; the shell reports `{ id, from, to }` (new `NavReorderEvent` type) and never reorders `items` itself. `PanelNavItem` now renders a row that contains the `<a class="ca-nav-item__link">` (a link cannot hold the actions button or the grip), so `.ca-nav-item` is the row, not the anchor. New messages `appShell.itemActions` and `appShell.moveItem`.
