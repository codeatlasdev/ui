---
"@codeatlasdev/ui": minor
---

PageShell: a header action marked `data-priority="primary"` stays visible and the others collapse into a More menu when the row is too narrow (same overflow mechanics as `Toolbar overflow="menu"`); the actions block shrinks instead of taking its content width, so the title column never drops under 12rem. Without a primary action nothing collapses.
