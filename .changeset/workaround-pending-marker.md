---
"@codeatlasdev/ui": minor
---

`codeatlas-ui lint` and `codeatlas-ui workarounds` accept a marker written before its issue exists: `ca-ui-workaround(pending: reason)` (or `pendente:`) excuses the line like `ca-ui-workaround(#n)` (#1081). `workarounds` lists pending markers in their own section, `--pending` prints only those (offline), and `--strict` exits 1 while one is left. `#0` is reported as `invalid` without asking the API, and a 404 is `not found` instead of `unknown`.
