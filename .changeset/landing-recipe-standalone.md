---
"@codeatlasdev/ui": patch
---

The Landing page recipe now prerenders when copied on its own: the sign-up and sign-in buttons and the plan CTAs use `signUp`/`signIn` constants at the top of the page that are in-page anchors (`#pricing`), instead of linking to `/sign-up` and `/sign-in`, which 404 the prerender unless the Auth pages recipe is also in the app. Point the constants at the real routes once they exist.
