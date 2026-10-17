---
"@codeatlasdev/ui": minor
---

`Popover` is controllable. `bind:open` and `onOpenChange` read and set the open state, and the `children` snippet receives `close`, which closes the popover and returns focus to the trigger, so a choice made inside it (a `Calendar` day, an option) can dismiss it. Existing popovers are unchanged.
