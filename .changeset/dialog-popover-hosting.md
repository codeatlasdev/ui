---
"@codeatlasdev/ui": patch
---

A menu, Select list, popover or tooltip that is already open when a Dialog, Sheet or Drawer opens (a shortcut or an async action opening the modal over it) now moves into that modal and stays clickable and above it. Before, it stayed outside the modal, so it went inert and could not be used. When a modal closes before the popovers hosted in it, they are handed to the next modal or put back where they were declared instead of being removed with it. The layer stack and the stacking contract are covered by new tests and documented on the Dialog page (#225).
