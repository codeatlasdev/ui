---
"@codeatlasdev/ui": minor
---

`HeatmapChart variant="matrix"` reads correctly in dark mode (#1061): empty cells start the ramp on `--ca-surface-sunken` instead of a near-transparent white, and the axis bands are off by default, so they no longer show through as a checkerboard that looks like data. The legend is a static scale (`calculable: false`). New props: `emptyColor`, `legend` (`false` hides the scale and gives its height back) and `bands`.
