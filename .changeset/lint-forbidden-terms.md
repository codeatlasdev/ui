---
"@codeatlasdev/ui": minor
---

`codeatlas-ui lint` adds `forbidden-term` (#1156): list the words your interface must not use in `forbiddenTerms` in `ui-guard.config.json` (`"Usuário"`, or `{ "term": "Cliente", "use": "Contato", "caseSensitive"?: true }`) and the lint reports each one in the visible text of a `.svelte` template with file and line. A term matches as a whole word, in any case unless `caseSensitive`, and a phrase across line breaks; comments, `<script>`, `<style>`, `{…}` expressions and non-text attributes are never read. A malformed entry stops the run with exit code 2.
