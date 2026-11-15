---
"@codeatlasdev/ui": minor
---

New `ClampedText` (#1167): long text cut to `lines` lines (default 3) with a "Show more" button only when the text really overflows (`scrollHeight > clientHeight`, measured again when the width, the text, the web fonts or `lines` change). The button has `aria-expanded`, `aria-controls` on the text and its visible text as accessible name; labels come from the new `clampedText` catalog group ("Show more" / "Show less", "Ver mais" / "Ver menos" in pt-BR) and `moreLabel` / `lessLabel` override them. `expanded` is bindable, `class` and other attributes go to the root. Expanding keeps the page scroll position, also when only the button is in view (scroll anchoring is paused on the ancestors for that layout), collapsing scrolls the button back into view, and there is no height animation. New classes: `ca-clamped-text`, `ca-clamped-text__content`, `ca-clamped-text__toggle`.
