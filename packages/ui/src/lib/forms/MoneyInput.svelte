<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import TextField from '../components/TextField/TextField.svelte';
  import { useLocale } from '../i18n/index.js';
  import { forms } from '../i18n/groups/forms.js';
  import { useMessages } from '../i18n/state.svelte.js';
  import { parseAmountToCents, parseInputToCents, toFieldText } from './money.js';

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
    /**
     * A sign button after the input (`aria-pressed` while the amount is negative), for keypads
     * without a minus key. Default: on when `allowNegative` is set.
     */
    signToggle?:    boolean;
    /**
     * `"fill"` (default): digits shift in from the right, `123456` → R$ 1.234,56.
     * `"typed"`: the text is free while focused and read as an amount with the locale's
     * separators (`12,5` → R$ 12,50, `1.234` → R$ 1.234,00); formatted on blur.
     */
    entry?:         'fill' | 'typed';
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
    signToggle,
    entry = 'fill',
    currency,
    locale,
    placeholder,
    onchange,
    ...rest
  }: Props = $props();

  const t = useMessages(forms);
  const activeLocale = useLocale();
  const opts = $derived({
    currency: currency ?? 'BRL',
    locale: locale ?? (currency ? activeLocale() : 'pt-BR'),
  });
  const shownPlaceholder = $derived(placeholder ?? toFieldText(0, opts));

  function clamp(cents: number): number {
    let v = allowNegative ? cents : Math.abs(cents);
    if (min !== undefined && v < min) v = min;
    if (max !== undefined && v > max) v = max;
    return v;
  }

  /** What the current text means: a typed amount, or the formatted text of a fill field. */
  function read(raw: string): number {
    return entry === 'typed' ? clamp(parseAmountToCents(raw, opts)) : parseInputToCents(raw, opts);
  }

  let text = $state(toFieldText(clamp(value), untrack(() => opts)));

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
    if (changed || untrack(() => read(text)) !== v) {
      text = toFieldText(v, opts);
    }
  });

  function emit(cents: number) {
    value = cents;
    onchange?.(cents);
  }

  function onInput(raw: string) {
    if (entry === 'typed') {
      // Free text while focused; `max`/`min` already hold for the bound value, the text follows on blur.
      emit(read(raw));
      return;
    }
    // Type-to-fill: digits shift in from the right. A "-" anywhere toggles negative.
    const digits = raw.replace(/\D/g, '');
    const negative = allowNegative && raw.includes('-');
    const cents = clamp((negative ? -1 : 1) * Number(digits || 0));
    text = digits === '' && !negative ? '' : toFieldText(cents, opts);
    emit(cents);
  }

  // A paste is an amount ("1.234,56", "12,5"), never a digit stream; text without a digit is
  // ignored. A typed field takes it as typed text, so it is only filtered here.
  function onPaste(e: ClipboardEvent) {
    const pasted = e.clipboardData?.getData('text') ?? '';
    if (!/\d/.test(pasted)) {
      e.preventDefault();
      return;
    }
    if (entry === 'typed') return;
    e.preventDefault();
    const cents = clamp(parseAmountToCents(pasted, opts));
    text = toFieldText(cents, opts);
    emit(cents);
  }

  const showSign = $derived(allowNegative && (signToggle ?? true));
  // A negative zero ("-R$ 0,00", after the toggle) has no negative value yet but shows the sign.
  const negativeShown = $derived(value < 0 || /^\s*[-−]/.test(text));

  function toggleSign() {
    const cents = clamp(-value);
    // Zero has no sign to show: keep a leading "-" so the digits typed next come in negative.
    text = toFieldText(cents === 0 && !negativeShown ? -0 : cents, opts);
    emit(cents);
  }

  function onBlur(e: FocusEvent) {
    text = toFieldText(value, opts);
    rest.onblur?.(e);
  }
</script>

{#snippet signTrailing()}
  {@render rest.trailing?.()}
  <button
    type="button"
    class="ca-money__sign"
    aria-label={t().forms.moneyNegative}
    aria-pressed={negativeShown}
    disabled={rest.disabled || rest.readonly}
    onclick={toggleSign}
  ><span aria-hidden="true">±</span></button>
{/snippet}

<TextField
  {...rest}
  trailing={showSign ? signTrailing : rest.trailing}
  inputmode={entry === 'typed' ? 'decimal' : 'numeric'}
  placeholder={shownPlaceholder}
  bind:value={text}
  oninput={onInput}
  onpaste={onPaste}
  onblur={onBlur}
/>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  /* Sized like the TextField reveal toggle: inside the field's own height, no layout shift; under
     a coarse pointer the hit area grows to the 44px touch target, like the base.css list. */
  .ca-money__sign {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ca-tf-reveal-size, var(--ca-space-7));
    height: var(--ca-tf-reveal-size, var(--ca-space-7));
    margin-inline-end: calc(var(--ca-space-1) * -1);
    padding: 0;
    border: none;
    border-radius: var(--ca-tf-reveal-radius, var(--ca-radius-sm));
    background: transparent;
    color: var(--ca-text-hint);
    font: inherit;
    font-size: var(--ca-font-size-body1);
    line-height: 1;
    transition: color var(--ca-duration-fast) var(--ca-ease-standard);
  }
  .ca-money__sign:hover,
  .ca-money__sign[aria-pressed='true'] { color: var(--ca-text-primary); }
  .ca-money__sign:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: calc(var(--ca-border-width-focus) * -1);
  }
  .ca-money__sign:disabled { color: var(--ca-text-disabled); }
  @media (pointer: coarse) {
    .ca-money__sign { position: relative; }
    .ca-money__sign::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: max(100%, var(--ca-touch-target));
      height: max(100%, var(--ca-touch-target));
      translate: -50% -50%;
    }
  }
}
</style>
