---
"@codeatlasdev/ui": minor
---

`HoverCard` (#454): a rich preview that opens on pointer hover (after `openDelay`) and on keyboard focus (at once), stays open while the pointer crosses into it (`closeDelay`), closes on Escape and blur, and is reachable with Tab from the trigger. A hint layer: it never takes Escape or presses from the layer below. Touch never opens it, so a tap only runs the trigger's own action (use `Popover` for a tap-to-open preview). `triggerChild`/`trigger`, `bind:open`, `onOpenChange`, `side`, `align`, `sideOffset`. `FloatingLayer` forwards `onfocusout`.
