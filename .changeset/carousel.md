---
"@codeatlasdev/ui": minor
---

`Carousel` and `CarouselItem` (#445, part of #432): native scroll-snap slides that follow the WAI-ARIA carousel pattern (labelled region, slides named "n of m", off-screen slides `inert`, labelled dot buttons with `aria-current`, arrows / Home / End on the focused carousel). `perView`, `loop`, `bind:index`, `onchange`; `autoplay` (ms) is opt in, adds a Pause button, stops on focus or hover, is a polite live region only when stopped, and never runs under `prefers-reduced-motion`. No carousel engine dependency. Replaces shadcn `Carousel`. New i18n group `carousel` (en, pt-BR).
