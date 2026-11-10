---
"@codeatlasdev/ui": minor
---

`RecordList` takes `actions`: the list appends the actions track (`var(--ca-touch-target)`) to `columns` for the header and every row. The documented `2.75rem` track was 41px at the 15px root and left the 44px actions cell overflowing it; docs and demos now use the token, and a list whose last track is narrower than the actions cell logs one dev warning.
