---
"@codeatlasdev/ui": minor
---

`SimpleTable` gets a dense, spreadsheet-like mode (#360): `density="compact"` (rows up to 40px), `frame={false}`, `scroll="none"` (the caller owns scrolling, so the sticky header sticks to your page or panel), `stickyColumns={n}` (pinned columns keep an opaque background in hover, selected and focus states) and `headerCase="sentence"`. New `TableRow` (`selected`, `onactivate`: Tab, Enter/Space and click, nested controls never bubble), `TableGroupRow` (collapsible, `aria-expanded`, sticky label) and `TableSortHeader` (`sort`, `onsort`, `aria-sort`).
