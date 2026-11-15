---
"@codeatlasdev/ui": minor
---

`codeatlas-ui lint` adds `hard-navigation` (#1155): `location.href = "/orders"`, `location.pathname =`, `location =` (also through `window.` or `document.`), `location.assign()` and `location.replace()` with a literal that stays in the app (a path, `` `/orders/${id}` ``, `` `${base}/x` ``, a relative path or a query) reload the whole app and are reported with file and line; navigate with `goto()`. Routes that must reload (a logout, an SSO hand-off) go in `reloadRoutes` in `ui-guard.config.json` (`["/logout", "/auth/*"]`: query, hash and trailing slash ignored, `*` matches any run), and an entry that is not a path stops the run with exit code 2. Other origins (`https:`, `mailto:`, `//host`), `#hash`, variables, reads and comments are never flagged. The rule is on by default and, unlike the others, also reads `.ts` and `.js` modules (tests and `.d.ts` aside); those modules are checked for this rule only.
