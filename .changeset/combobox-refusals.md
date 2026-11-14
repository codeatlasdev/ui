---
"@codeatlasdev/ui": minor
---

`Combobox` says why it refuses a tag and keeps the text (#1214). In `creatable` + `multiple` mode a tag already in the value is no longer added twice ("Already added"); `validateCreate(value)` returns a message to refuse a new tag (too short, a bad format); `max` limits the number of values ("Limit of N reached"). The message is an alert under the search field (`.ca-combobox__refusal`) until the text changes or the list closes.
