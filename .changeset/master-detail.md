---
"@codeatlasdev/ui": minor
---

New `MasterDetail`: a responsive list and detail (an inbox). Two columns from a 900px container (`breakpoint` `sm`/`md`/`lg`) with an `empty` state; below it the master fills the container and the detail becomes a full-screen modal layer with a back button and focus restore, and the browser's Back closes it under the overlay-history bridge. The switch is a CSS container query on one DOM node, so the server HTML and the first paint are already right (no `responsive.width` branch, no flash of the squeezed desktop layout, no double mount, no lost draft). `resizable` adds a splitter, `history={false}` opts the pane out of the history entry.
