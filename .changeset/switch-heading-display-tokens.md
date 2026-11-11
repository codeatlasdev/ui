---
"@codeatlasdev/ui": minor
---

Switch geometry and colours are theme tokens, and the display sizes are a theme option. `components.switch` (`trackWidth`, `trackHeight`, `padding`, `borderWidth`, `thumbSize`, `thumbBackground`, `thumbShadow`, `onBackground`, and `sm`) writes `--ca-switch-*`; the thumb travels `track - thumb - 2 * (padding + border)`, so it stays flush at both ends for any size. New `size="sm"` prop (32 x 20 track, 14px thumb). `typography.displaySizes` (`{ 1?, 2?, 3? }`, any CSS length or `clamp()`) writes `--ca-font-size-display-1/2/3`. Defaults render unchanged.
