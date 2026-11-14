---
"@codeatlasdev/ui": minor
---

`MoneyInput` reads amounts the way people write them (#1208). `entry="typed"` keeps the text as typed and parses it with the locale's separators (`12,5` is R$ 12,50, `1.234` is R$ 1.234,00, `1.234,56` is R$ 1.234,56), formatting on blur; the default `entry="fill"` keeps digits shifting in from the right. A paste is read as an amount in both modes (pasting `12,5` no longer gives R$ 1,25) and a paste without digits leaves the value alone. With `allowNegative` a sign button (`.ca-money__sign`, `aria-pressed`, named "Negative") follows the input, since a numeric keypad has no minus key; `signToggle={false}` hides it. The field asks for the numeric keypad (`inputmode="numeric"`, or `"decimal"` when typed). New helper `parseAmountToCents(text, { currency, locale })` in `@codeatlasdev/ui/forms`.
