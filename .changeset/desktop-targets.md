---
"@codeatlasdev/ui": patch
---

Desktop targets reach 24px (WCAG 2.5.8, #1056): `Breadcrumb` links and a clickable `Chip` (a `sm` one is drawn 20px) get an invisible hit area of at least 24px on a fine pointer (44px on touch) without changing their size, and a click on the padding of a `TextField` frame focuses its input. `Tooltip` warns in dev (`[ca-ui]`) when its `children` hold a focusable control, which nests a control inside its trigger button; pass it through `triggerChild`.
