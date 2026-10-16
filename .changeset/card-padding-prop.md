---
"@codeatlasdev/ui": minor
---

`Card` has a `padding` prop (`'none' | 'sm' | 'md' | 'lg'`, any CSS length, or a number of pixels) so a one-off density no longer needs an inner wrapper; `flush` stays as the alias of `'none'`. The docs now say that Card's content is already padded, and in development a `[ca-ui]` warning (`card-double-padding`) fires once when the first child adds its own padding on top of the card's (the 20px + 20px = 40px "oversized card").
