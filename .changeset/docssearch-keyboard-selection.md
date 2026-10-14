---
"@codeatlasdev/ui": patch
---

DocsSearch: keyboard selection no longer gets stolen by the pointer or reset by a lazy index. A row appearing under a stationary pointer (results render, dialog animates in) fired `mouseenter` and moved the highlight; hover now follows real `mousemove`. A lazy `index()` resolving while the dialog is open re-ran the open effect and wiped the typed query. ArrowDown on an empty list no longer stores `-1`.
