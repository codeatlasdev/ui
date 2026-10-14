---
"@codeatlasdev/ui": major
---

bits-ui is gone. Every interactive component now runs on the library's own headless layer (WAI-ARIA Authoring Practices, platform first): native `<dialog>` for Dialog, AlertDialog, Sheet, Drawer, Lightbox, CommandPalette and DocsSearch; native inputs for Checkbox, Switch and RadioGroup; own floating, dismiss, focus, roving-focus, listbox and presence primitives for Popover, Tooltip, DropdownMenu, Select, Combobox, Tabs, ToggleGroup, SegmentedControl, Slider, PinInput, Accordion, Collapsible, ScrollArea, Pagination, Avatar and the date family. Public props, classes and `data-state` attributes are unchanged.

- Smaller bundles: AppShellLayout 41.2 → 35.1 kB gzip, form controls −18.7 kB, date family −45.2 kB.
- No more `ssr.noExternal` for bits-ui and no WKWebView dialog workaround needed.
- `Select` / `Combobox` with `required` block native form submit while empty and focus the trigger.
- Disabled `Slider` now renders dimmed (the selector never matched before).
- Interaction patterns were designed after studying Bits UI (credited in NOTICE).

### Breaking (upgrade notes)

Props, exported types, `ca-*` classes and `data-state` attributes did not change. What changed is the DOM around overlays and the dependency set:

- Modal overlays (Dialog, AlertDialog, Sheet, Drawer, Lightbox, CommandPalette, DocsSearch) are a single native `<dialog>` moved to `<body>`; the scrim is its `::backdrop`. CSS that targeted a separate overlay/scrim element or the old portal container no longer matches. Style `dialog.ca-overlay::backdrop` instead.
- `--bits-*` CSS variables and `data-bits-*` attributes are gone (`--ca-anchor-width`, `--ca-accordion-height`, `--ca-collapsible-height`, `data-ca-day` replace the ones used internally).
- `bits-ui` is no longer installed with the package. If your app imports from `bits-ui` directly, add it to your own dependencies.
- Select no longer renders bits-ui's hidden `<input>`; `required` still blocks native form submit.

