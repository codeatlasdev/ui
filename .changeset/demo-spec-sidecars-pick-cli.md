---
"@codeatlasdev/ui": minor
---

Every numbered demo now has a reviewed `<Variant>.meta.json` sidecar (`summary`, `use`, `spec`, `tags`, `shape`), so `get_demo`, `search_demos` and `/api/v1/en/{e,p}/NNN.txt` return what the demo shows, when to use it and a Spec list of its literal values (props, snippets, state, counts). The catalog check (`manifest --check`, run by every build) now fails on a demo without a sidecar, a sidecar without a demo, an unknown key, a bad `shape`, or a spec line that quotes a token that is not in the demo source. New `codeatlas-ui pick [ids...]` opens the gallery, listens on `127.0.0.1` with a random per-run token and prints the ids you send with "Send to AI" (`#005 #012`).
