---
"@codeatlasdev/ui": patch
---

`migrate` looks up `typescript` in the project directory first (then next to the CLI) and prints `migrate needs typescript (bun add -d typescript)` with exit code 1 when it is missing, instead of crashing with `Cannot find package 'typescript'`. This also fixes `bunx @codeatlasdev/ui migrate` in layouts where the CLI cache directory cannot see the project's `typescript`.
