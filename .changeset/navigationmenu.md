---
"@codeatlasdev/ui": minor
---

`NavigationMenu`, `NavigationMenuItem` and `NavigationMenuLink` (#457): disclosure navigation for marketing headers, not `role="menu"`. A `nav` with a list of links and `aria-expanded`/`aria-controls` buttons that reveal a panel of links; one tab stop with Left/Right/Home/End across the top level, Enter/Space toggle, Down opens into the panel, Tab flows through the panel links and on, Escape returns focus to the button. Hover opens after `openDelay`, switches at once while one is open and closes after `closeDelay`; a click toggles (touch). `current` sets `aria-current="page"`; `description` adds a second line to a panel link.
