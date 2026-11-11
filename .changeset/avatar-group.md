---
"@codeatlasdev/ui": minor
---

New `AvatarGroup`: overlapping avatars from `items` (`{ name, src }`) or children, `max` with a "+N" chip whose accessible name says how many more ("2 more" / "mais 2", `moreLabel` overrides it), `size` and `shape` as on `Avatar`, `role="group"` with a `label`, and each avatar keeps its name. Overlap and ring come from `--ca-avatar-group-overlap` and `--ca-avatar-group-ring`.
