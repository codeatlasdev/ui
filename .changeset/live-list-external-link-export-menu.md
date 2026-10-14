---
"@codeatlasdev/ui": minor
---

Three patterns for result views, from the DX feedback in #48. `LiveList` shows rows that stream in (SSE, WebSocket, bulk jobs): a named `role="log"` with batched polite announcements instead of one per row, determinate or indeterminate progress, and auto-scroll that follows the newest row only while the user is at the bottom, pauses when they scroll up (with a "N new" jump button) and never moves focus. `ExternalLink` is a link to another site with `target="_blank"`, `rel="noopener noreferrer"`, a decorative icon and a localised "(opens in a new tab)" for screen readers (`externalLink.newTab` in the i18n catalog), made for table cells. `ExportMenu` is an Export button with a CSV / JSON `DropdownMenu`; the helpers `toCsv`, `toJson`, `downloadFile` and the `ExportColumn` type are exported too (RFC 4180, UTF-8 BOM in the downloaded CSV, spreadsheet formulas neutralised). New i18n keys: `externalLink`, `exportMenu`, `liveList` (en, pt-BR).
