---
"@codeatlasdev/ui": minor
---

Add the `@codeatlasdev/ui/seo` entry point: a `Seo` head component (title template, canonical, robots, hreflang, Open Graph, Twitter, JSON-LD with `<` escaped), typed JSON-LD builders (`organization`, `website` with `SearchAction`, `softwareApplication`, `product`, `faqPage`, `breadcrumbList`, `article`, `graph`), `sitemapXml` and `robotsTxt`, `llmsTxt` and a `markdownNegotiation` SvelteKit handle for AI crawlers, `ogImageRoute` for 1200x630 social images through an injected headless browser, and PWA helpers `manifest()` and `appleMeta()`. `caThemeHandle` now warns in development when the final HTML has no `viewport-fit=cover` or no `lang` on `<html>`. `esm-env` is now a direct dependency (dev-only warnings).
