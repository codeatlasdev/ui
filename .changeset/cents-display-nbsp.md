---
"@codeatlasdev/ui": patch
---

`centsToDisplay` keeps the no-break space `Intl` puts after the currency symbol (`"R$\u00a0123,45"`), so a price no longer wraps between the symbol and the number. `MoneyInput` still shows and parses a plain space in its editable text.
