<script lang="ts">
  import { useT } from '../i18n/state.svelte.js';
  import { untrack, type Snippet } from 'svelte';
  import MaskedField from './MaskedField.svelte';
  import { maskPhoneBR } from './masks.js';
  const t = useT();

  interface Props {
    label?:        string;
    placeholder?:  string;
    /** E.164 value, e.g. `+5511987654321`. Empty string when incomplete or empty. */
    value?:        string;
    /** Only `BR` is supported today. */
    country?:      'BR';
    error?:        string;
    description?:  string;
    disabled?:     boolean;
    required?:     boolean;
    readonly?:     boolean;
    size?:         'sm' | 'md';
    class?:        string;
    name?:         string;
    leading?:      Snippet;
    trailing?:     Snippet;
    onblur?:       (e: FocusEvent) => void;
  }

  let {
    value = $bindable(''),
    country = 'BR',
    placeholder = '(11) 98765-4321',
    ...rest
  }: Props = $props();

  const dial = $derived({ BR: '55' }[country]);

  function toDisplay(e164: string): string {
    const d = e164.replace(/\D/g, '');
    return maskPhoneBR(d.startsWith(dial) ? d.slice(dial.length) : d);
  }

  let display = $state(toDisplay(value));

  function toE164(masked: string): string {
    const d = masked.replace(/\D/g, '');
    return d.length >= 10 ? `+${dial}${d}` : '';
  }

  // External E.164 changes refresh the display. Reads `display` untracked so typing
  // (which updates display before value) never fights this sync.
  $effect(() => {
    const v = value;
    if (v !== untrack(() => toE164(display))) display = toDisplay(v);
  });

  function validate(masked: string): string | undefined {
    return toE164(masked) ? undefined : t().forms.phoneIncomplete;
  }
</script>

<MaskedField
  {...rest}
  {placeholder}
  mask={maskPhoneBR}
  {validate}
  autocomplete="tel-national"
  bind:value={display}
  oninput={(v) => (value = toE164(v))}
/>
