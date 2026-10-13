---
"@codeatlasdev/ui": patch
---

`CommandPalette`: pressing Enter on a result closes the palette again with bits-ui 2.19. Closing returns focus to the element that opened it while the Enter key is still down, and the browser then activated that element and reopened the palette; the palette now closes on `keyup`. Also builds with `@sveltejs/package` 3 and TypeScript 6.
