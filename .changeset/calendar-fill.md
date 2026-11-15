---
"@codeatlasdev/ui": minor
---

Calendar and RangeCalendar take `fill`: the calendar takes the full width of its container instead of sizing itself (#1230). The seven columns share the width, and a day keeps its square size (the touch target under a coarse pointer), centred in its column, narrowing only when the column is narrower, so in a 296px phone card nothing overflows or scrolls sideways and in a 768px card the calendar no longer leaves half of it empty. The months of a RangeCalendar share the width too: side by side while each is at least seven controls wide, stacked below that. New class: `ca-cal--fill`. Without `fill` nothing changes.
