---
"@codeatlasdev/ui": minor
---

`Kanban` on a phone: the stages are a horizontal scroll-snap track (`swipeStages`, default on), so swiping the board changes the stage and the tab strip follows it; holding a card at the left or right edge scrolls to the next stage, so a drag can end in another stage without the "Move to…" menu. `dragHandle` (`auto` under a coarse pointer, `always`, `none`) adds a grip that starts a touch drag at once, with no 350 ms hold, and `snap="columns"` snaps the desktop board to columns. `useDnd().sortable` gains `touchHold` and `instantTouch`.
