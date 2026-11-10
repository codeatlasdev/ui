---
"@codeatlasdev/ui": minor
---

`@codeatlasdev/ui/seo` exports `seoHead(props)` (the head of `<Seo>` as an HTML string) and `seoTags(props)` (the same as data, pure). `<Seo>` is now built on them, so Astro layouts, where `<svelte:head>` is dropped, get exactly the Svelte output. New "Seo in Astro" section in the SEO guide, including the static social-card path.
