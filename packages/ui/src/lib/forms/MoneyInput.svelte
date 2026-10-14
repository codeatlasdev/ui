<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import TextField from '../components/TextField/TextField.svelte';
  import { useLocale } from '../i18n/index.js';
  import { centsToDisplay, parseInputToCents } from './money.js';

  interface Props {
    label?:         string;
    placeholder?:   string;
    /** Amount in the currency's minor unit (integer). BRL: `123456` = R$ 1.234,56; JPY: `1234` = ¥1,234. */
    value?:         number;
    /**
     * ISO 4217 code. Decimals (USD 2, JPY 0, BHD 3) come from `Intl`. Default `"BRL"`.
     */
    currency?:      string;
    /**
     * BCP 47 tag for separators and symbol placement. Default: the active i18n locale when
     * `currency` is set; `"pt-BR"` when it is not (so the BRL default keeps its format).
     */
    locale?:        string;
    min?:           number;
    max?:           number;
    allowNegative?: boolean;
    error?:         string;
    description?:   string;
    disabled?:      boolean;
    required?:      boolean;
    readonly?:      boolean;
    size?:          'sm' | 'md';
    class?:         string;
    name?:          string;
    leading?:       Snippet;
    trailing?:      Snippet;
    onchange?:      (cents: number) => void;
    onblur?:        (e: FocusEvent) => void;
  }

  let {
    value = $bindable(0),
    min,
    max,
    allowNegative = false,
    currency,
    locale,
    placeholder,
    onchange,
    ...rest
  }: Props = $props();

  const activeLocale = useLocale();
  const opts = $derived({
    currency: currency ?? 'BRL',
    locale: locale ?? (currency ? activeLocale() : 'pt-BR'),
  });
  const shownPlaceholder = $derived(placeholder ?? centsToDisplay(0, opts));

  function clamp(cents: number): number {
    let v = allowNegative ? cents : Math.abs(cents);
    if (min !== undefined && v < min) v = min;
    if (max !== undefined && v > max) v = max;
    return v;
  }

  let text = $state(centsToDisplay(clamp(value), untrack(() => opts)));

  // External value changes (reset, programmatic set) refresh the display; an out-of-bounds
  // value is clamped back into `value`. `text` is read untracked: bind:value overwrites it
  // with the raw DOM string before `onInput` has updated `value`, and reacting to that
  // transient mismatch would reset what was typed. A currency/locale change always reformats
  // (the old text would parse to the same number but show the wrong symbol/separators).
  let formatKey = untrack(() => `${opts.locale}\u0000${opts.currency}`);
  $effect(() => {
    const v = clamp(value);
    if (v !== value) value = v;
    const key = `${opts.locale}\u0000${opts.currency}`;
    const changed = key !== formatKey;
    formatKey = key;
    if (changed || untrack(() => parseInputToCents(text, opts)) !== v) {
      text = centsToDisplay(v, opts);
    }
  });

  function onInput(raw: string) {
    // Type-to-fill: digits shift in from the right. A "-" anywhere toggles negative.
    const digits = raw.replace(/\D/g, '');
    const negative = allowNegative && raw.includes('-');
    const cents = clamp((negative ? -1 : 1) * Number(digits || 0));
    value = cents;
    text = digits === '' && !negative ? '' : centsToDisplay(cents, opts);
    onchange?.(cents);
  }

  function onBlur(e: FocusEvent) {
    text = centsToDisplay(value, opts);
    rest.onblur?.(e);
  }
</script>

<TextField
  {...rest}
  placeholder={shownPlaceholder}
  bind:value={text}
  oninput={onInput}
  onblur={onBlur}
/>
