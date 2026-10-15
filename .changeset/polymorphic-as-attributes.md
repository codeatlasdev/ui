---
"@codeatlasdev/ui": minor
---

`Box`, `Flex`, `Stack` and `Grid` are generic on `as`: `<Stack as="form" novalidate onsubmit={...}>` accepts the form's attributes, and the handler's `currentTarget` is an `HTMLFormElement` (same for `as="a"`, `as="label"`, `as="button"`...). An attribute that does not belong to the tag is a type error. Exports `PolymorphicProps` and `ElementTag`.
