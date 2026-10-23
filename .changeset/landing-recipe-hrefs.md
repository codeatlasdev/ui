---
"@codeatlasdev/ui": patch
---

The Landing page recipe links only to in-page anchors and to `/sign-in` and `/sign-up` (the Auth pages recipe), so copying it whole prerenders with `adapter-static`; before, `/pricing`, `/docs` and `/contact` failed the build with a 404.
