---
"@codeatlasdev/ui": minor
---

`<Seo>` completes the social and language tags (#207): `og.defaultImage` is the site-wide card used when a page has no `og.image` (also feeds `twitter:image` and the `summary_large_image` card), `twitter:title` and `twitter:description` mirror the page title and description, and the new `lang` prop sets `og:locale` and keeps `<html lang>` in sync on the client.
