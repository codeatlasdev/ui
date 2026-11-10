---
"@codeatlasdev/ui": minor
---

Back closes the topmost modal layer instead of leaving the page. New `bridgeOverlaysToHistory()` (root export; one history entry per open Dialog, AlertDialog, Sheet, Drawer, MobilePane, CommandPalette or Lightbox, unwound when a layer closes by button, Escape or scrim), `<OverlayHistory />` for SvelteKit in `@codeatlasdev/ui/kit` (shallow routing), `dismissTopLayer()`, `overlayStep()`, and a `history` prop on each of those components to opt out. `MobilePane` is now a modal `<dialog>` on the shared layer stack. `codeatlas-ui init` mounts the bridge. Opt-in at app level: nothing changes until it is mounted.
