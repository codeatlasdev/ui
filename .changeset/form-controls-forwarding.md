---
"@codeatlasdev/ui": minor
---

Form controls forward native attributes and expose their element, with one vocabulary (`ref`, `hideLabel`, rest props on the native element):

- `Checkbox`, `TextField`, `TextArea` and `FileUpload` spread every other attribute and handler (`data-*`, `maxlength`, `inputmode`, `onclick`, `onkeydown`, `name`, `capture`...) on the native `<input>`/`<textarea>`, and take a bindable `ref` with that element. `Checkbox` `onchange` now receives the native event as a second argument, and its forwarded `onclick` makes Shift range selection possible. `TextField`/`TextArea` gain `onfocus` and `hideLabel` (label kept for screen readers with `.ca-sr-only`; `aria-label` also works without a label).
- `Select` accepts `aria-label` and `aria-labelledby` for a compact select without a visible label. The trigger is named by that text followed by the current value (visible text stays in the name); without either, the placeholder names it as before.
- `FileUpload` gains `ref`, an `open()` instance method for a button outside the dropzone, and `list={false}`: a plain picker whose `onchange` receives only the files just picked, with no built-in list and nothing kept in `files` (the native input is cleared, so the same file can be picked again).
