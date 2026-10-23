---
"@codeatlasdev/ui": patch
---

Theme: `--ca-font-size-body1` no longer sets the root font-size. `:root` keeps the kit's rem base (`calc(0.9375rem * var(--ca-font-scale))`, 15px by default, still relative to the user's browser size), so default rendering is unchanged and overriding body1 only sizes the text on `body`. A denser body no longer shrinks labels, inputs, buttons and captions (#351).
