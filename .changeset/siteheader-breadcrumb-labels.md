---
"@codeatlasdev/ui": minor
---

SiteHeader: the breadcrumb takes screen names (#1177). `labels` maps a full path (`"/propostas"`) to its crumb text, and `resolveSegment(segment, index, segments)` names a dynamic segment (`/propostas/123` reads "Propostas / Proposta"); a crumb that neither names keeps the capitalised segment, and links stay the same paths. A trail too long for the bar now shrinks with an ellipsis on one line, before the `trailing` actions, instead of running under them at 390px.
