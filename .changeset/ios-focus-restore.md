---
"@codeatlasdev/ui": patch
---

Overlays return focus to the control that opened them on iPhone/iPad and Safari too. WebKit does not focus a tapped button (it focuses a focusable ancestor such as `<main tabindex="-1">`, or nothing), so focus used to land there on close and VoiceOver users lost their place. CommandPalette: Mod+K focuses the search field on touch devices with a keyboard (covered by a test now).
