---
"@codeatlasdev/ui": minor
---

`CopyButton` takes `aria-label` for the icon-only form (`label=""`), so each row of a list or table can announce its own name ("Copy client_id of Acme") instead of the same localized "Copy". The default stays the i18n `copyButton.label`. The label is ignored when `label` is visible, so the accessible name keeps containing the visible text. Remaining attributes (`data-*`, `id`, `aria-describedby`, …) are now forwarded to the underlying button.
