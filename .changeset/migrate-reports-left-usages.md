---
"@codeatlasdev/ui": patch
---

`migrate` now ends with a list of the usages it left for you (`file:line Component: reason (recipe)`), and `--strict` exits with code 1 when any remain. A `Grid` or `Stack` whose `cols`/`align` could not be mapped still gets its `gap` converted: `gap={20}` next to `cols="2fr 1fr"` becomes `gap="5"` instead of silently turning into step 20 (80px). Dynamic or off-scale gaps are reported, since their meaning changed from pixels to a step.
