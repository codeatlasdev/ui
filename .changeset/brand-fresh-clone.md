---
"@codeatlasdev/ui": minor
---

`caBrandPlugin` writes `src/generated/brand.ts` as soon as the Vite config resolves (the URLs depend only on a hash of the inputs, so no rendering is needed), not only at build start. New `codeatlas-ui brand` command and `brandUrls()` / `runBrand()`: render the icons and the module without a Vite run, so a job that only runs `svelte-check` on a fresh clone type-checks (`svelte-kit sync` does not load Vite plugins).
