---
"@codeatlasdev/ui": minor
---

`setAppBadge(count)`: one helper for the app icon badge (Badging API), from the package root for pages and from `@codeatlasdev/ui/utils/app-badge` for a service worker. It feature-detects, never throws (resolves `false` when unsupported or refused), clears on 0 and normalises the count (rounds down, reads a numeric string, caps at `Number.MAX_SAFE_INTEGER`), so a push handler and the page make the same call.
