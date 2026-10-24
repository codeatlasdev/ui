---
"@codeatlasdev/ui": patch
---

The stylesheet drops 12 utility classes that no component, template or documented API ever used: `.glass-bg-extend`, `.glass-inner-sm|md|lg`, `.glass-prominent`, `.glass-scroll-edge-top|bottom`, `.ca-toolbar-sep`, `.ca-clear-btn`, `.ca-row-check`, `.ca-trend-up|down`. `styles/global.css` shrinks by 242 B gzip (17458 B to 17216 B) and its size budget goes back from 17500 B to 17250 B. An app that styled an element with one of these classes keeps the rule in its own CSS.
