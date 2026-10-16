---
"@codeatlasdev/ui": minor
---

AI feedback loop. The `ca-ui-mcp` server has a new `report_issue` tool: an agent that hits a library problem (bug, missing prop or component, migration gap, wrong docs) gets a sanitized issue draft (paths, foreign URLs, emails, IPs, tokens, env assignments and foreign package scopes are redacted, and the redactions are listed) with a prefilled link to the new "AI report" issue form and a `gh issue create` command. It never posts. `bunx @codeatlasdev/ui workarounds` lists the `// ca-ui-workaround(#<n>): <why>` markers an agent left in your code and which issues are already closed (read-only, offline-safe, exit 0).
