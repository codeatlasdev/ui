---
"@codeatlasdev/ui": minor
---

`ca-ui-mcp` gains `get_release(version)`: a release as a post for agents, with its highlights, the numbers and the conditions each was measured under, the behaviour changes to check after upgrading, the upgrade command and every merged change grouped by area with its pull request and issue. Without a version it returns the digest of every release. It reads `dist/releases.json`, built from the release posts in the docs site.
