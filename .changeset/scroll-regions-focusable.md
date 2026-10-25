---
"@codeatlasdev/ui": patch
---

`PreviewStage` frames and `ResizablePanel`s that scroll are keyboard-reachable while their content overflows (`scrollFocusable`, WCAG 2.1.1): a demo taller than the stage, or a narrow panel whose content is wider than it, no longer traps its content out of keyboard reach. Without overflow they add no tab stop.
