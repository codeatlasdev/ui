---
"@codeatlasdev/ui": minor
---

Brand assets from one mark. `caBrandPlugin` and `generateBrand` (`@codeatlasdev/ui/vite`) render a content-hashed favicon (SVG that follows `prefers-color-scheme`, ICO, PNG), `apple-touch-icon`, 192/512/maskable manifest icons and a web app manifest from one SVG with `{{ink}}`/`{{spark}}` placeholders and your theme; `resolveBrand` and `renderMark` expose the resolved sRGB colors. `iconLinks` and `ogCard` (`@codeatlasdev/ui/seo`) emit the head links and the 1200x630 social-card HTML for `renderOgImage`. `<Seo>` now also writes `og:image:type` and `twitter:image`. `@resvg/resvg-js` and `png-to-ico` are optional peer dependencies.
