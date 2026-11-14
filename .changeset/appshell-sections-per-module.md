---
"@codeatlasdev/ui": minor
---

AppShellLayout: panel sections keep their open state per module. Two modules with a section of the same label (`Cadastros` in CRM and in Finance) no longer open and close together, on screen or in storage: `persistPanel` now stores a section under `<module id>/<label>`, and a choice stored by an earlier version under the label alone is still read until the user toggles that section again. New prop `sectionsDefaultOpen` (default `true`, today's behavior): `false` starts every section that sets no `defaultOpen` of its own closed. The section holding the current page still opens on load, and a closed section now also opens when the user navigates to a page inside it (#1173).
