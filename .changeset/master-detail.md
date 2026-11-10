---
"@codeatlasdev/ui": minor
---

New `MasterDetail`: a responsive list and detail (an inbox). Two columns when wide with an `empty` state; on a narrow container the detail becomes a full-screen modal layer with a back button and focus restore, from one DOM mount and a container query (no `responsive.width` branch, no first-paint flash, no lost draft).
