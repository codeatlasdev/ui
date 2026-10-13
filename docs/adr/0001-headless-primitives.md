# ADR 0001: Headless primitives: platform first, bits-ui where behavior is hard

Status: accepted (2026-10-13)

## Context

`@codeatlasdev/ui` wraps 26 bits-ui primitives (42 imports, bits-ui 2.19.5 pinned). Measured with the
size-limit harness (esbuild, minified, tree-shaken, gzip, `svelte` external):

| Component | gzip | bits-ui | floating-ui | runed/toolbelt | ours |
|---|---|---|---|---|---|
| Dialog | 22.2 kB | 49% | 0% | 16% | 18% |
| Tooltip | 32.2 kB | 62% | 17% | 12% | 1% |
| Select | 41.9 kB | 60% | 13% | 9% | 9% |
| DatePicker | 69.1 kB | 68% | 8% | 5% | 7% |

bits-ui is accessible and maintained, but it is the largest single cost in every component, and it
has caused integration work this cycle: raw `.svelte` files require `ssr.noExternal`, and the Dialog
misbehaves in WKWebView (atlas desktop, `src/app.css:348-352` workaround).

Supported browsers (the floor already implied by shipped CSS: `@layer`, `:has`, container queries,
`color-mix`): **Safari / iOS 16.4+, Chrome / Edge 111+, Firefox 113+.**

## Decision

Per primitive, in this order of preference:

1. **The platform** when it provides the behavior inside the browser floor: no dependency, smaller,
   and correct in WebViews.
2. **bits-ui** when the behavior is hard to get right (typeahead, roving focus with virtualized or
   segmented input, collision-aware floating positioning, locale-aware date segments) or the
   platform feature is outside the floor.

A full rewrite of all 26 primitives is rejected: the date family alone (Calendar, RangeCalendar,
DateField, TimeField, DatePicker, DateRangePicker) re-implements locale segment editing that
bits-ui and `@internationalized/date` already get right, and the payoff is bundle size the platform
route captures anyway for the simple primitives.

| Primitive | Target | Why |
|---|---|---|
| Dialog, AlertDialog, Sheet, Drawer | native `<dialog>` + `showModal()` | Focus containment, `inert` background, Esc, top layer (Safari 15.4). Fixes the WKWebView bug. |
| Collapsible, Accordion | `<details>` / `<summary>` | Native disclosure; exclusive accordion via a small script (the `name` attribute is Safari 17.2, outside the floor). |
| Checkbox, Switch, RadioGroup | native `<input type=checkbox/radio>` (`role="switch"` for Switch) | Form participation, labels, keyboard for free. |
| Avatar, Pagination, ScrollArea | plain elements / native scrolling | No behavior worth a dependency. |
| Tooltip, Popover, DropdownMenu, Select, Combobox | bits-ui (keep) | `popover` is Safari 17 and CSS anchor positioning Safari 26: both outside the floor. Collision handling needs floating-ui. |
| Tabs, ToggleGroup, Slider, PinInput | bits-ui (keep) | Roving focus, pointer + keyboard value models, paste/segment handling. |
| Calendar, RangeCalendar, DateField, TimeField, DatePicker, DateRangePicker | bits-ui (keep) | Locale-aware segment editing. |

Revisit the "keep" rows when the floor reaches Safari 17 (popover) and Safari 26 (anchor
positioning).

## Migration rules

- One family per change. The public API of each component (props, events, `ca-*` classes,
  `data-state` attributes used in CSS) does not change; consumers see no diff.
- Gate per family: existing browser tests + axe, component VRT unchanged (no baseline updates),
  the site layout spec (all pages, 5 viewports), and a WebKit run (`iphone` project) for overlays.
- Each family PR states the measured bundle delta from the size-limit harness and lowers the
  ratchet in `size-limit.json` accordingly.
- Credit bits-ui (MIT) in `NOTICE` for any behavior ported from it.

## Consequences

- Dialog family and the simple controls drop most of their JS (bits-ui + runed share above).
- bits-ui stays a dependency for floating, list and date behavior; `ssr.noExternal` stays.
- The WKWebView workaround in atlas desktop can be removed once the Dialog family lands.
