---
"@codeatlasdev/ui": minor
---

Lightbox opens videos and galleries. `items` (`{ type?: 'image' | 'video', src, alt?, caption?, meta?, poster?, download? }`, exported as `LightboxItem`) plus a bindable `index` add previous/next buttons, ArrowLeft/ArrowRight and swipe (no wrap; the end buttons are `aria-disabled` so focus stays put), a counter, caption and sender/time line, video with controls (paused when you move on), and a Download button (`ondownload` or a plain `<a download>`). `src`/`alt` still work as a single-item shortcut. New `lightbox.previous`, `next`, `download` and `counter` labels in en and pt-BR; the close button moved into a `.ca-lightbox__tools` bar.
