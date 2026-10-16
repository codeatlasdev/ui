---
"@codeatlasdev/ui": minor
---

Avatar renders the photo as a real `<img>` (no detached `Image()` probe, so no double download) and passes `loading`, `referrerpolicy` and `crossorigin` through, so `loading="lazy"` keeps a 200-row list from firing 200 requests and `referrerpolicy="no-referrer"` works with CDNs that reject a cross-origin `Referer`. `fallback` now also takes a snippet (an icon for groups, channels and bots), and `onerror` fires when the image fails so you can refetch a signed URL. The fallback is always rendered beneath the image, so the box never changes size. The `data-status` attribute on `.ca-avatar` is gone.
