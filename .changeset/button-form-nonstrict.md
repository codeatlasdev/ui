---
"@codeatlasdev/ui": patch
---

`<Button type="submit">` and `<Button type="submit" form="id">` type-check in apps without `strict` (the SvelteKit 2 scaffold): svelte-check widens a static `type="submit"` to `string`, which matched neither branch of the Button props union (`form` was `never`). The button branch now accepts the widened `string`. Documented on Button and Dialog: a submit button in a Dialog `actions` footer names its form with `form`.
