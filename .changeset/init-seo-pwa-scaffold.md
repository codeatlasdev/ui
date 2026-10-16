---
"@codeatlasdev/ui": minor
---

`codeatlas-ui init` scaffolds SEO and PWA on SvelteKit (#205): prerendered `manifest.webmanifest`, `robots.txt` and `sitemap.xml` routes built with the `seo` helpers, a service worker (`src/service-worker/index.ts` on `$app/service-worker`, `$app/manifest` and `$app/env` for Kit 3; `src/service-worker.ts` on `$service-worker` for Kit 2) with a prerendered `/offline` page, and a default `<Seo>` with canonical and manifest link in the root layout. Existing files are never overwritten; after creating them `init` reminds the app to set `paths.origin` (otherwise Kit's prerender placeholder origin reaches the sitemap and canonical URLs), add the icons and exclude `src/service-worker` from `tsconfig.json` on Kit 3.
