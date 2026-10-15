---
"@codeatlasdev/ui": patch
---

`toCsv`, `toJson`, `ExportColumn` and `ExportMenu` accept any object row type (`T extends object`), so rows typed with an `interface` no longer need a cast. `key` is still checked against `keyof T`.
