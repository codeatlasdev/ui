<script lang="ts">
  import { useT } from '../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import MaskedField from './MaskedField.svelte';
  import { maskCEP } from './masks.js';
  import type { CepAddress } from './types.js';
  const t = useT();

  interface Props {
    label?:         string;
    placeholder?:   string;
    /** Masked CEP (`01310-100`). */
    value?:         string;
    /**
     * Resolve an 8-digit CEP to an address. The package never fetches: inject ViaCEP
     * (or any provider) here. Return `null` when the CEP is unknown.
     */
    onlookup?:      (cep: string) => Promise<CepAddress | null>;
    /** Called with the address after a successful lookup. */
    onresolve?:     (address: CepAddress) => void;
    /** True while `onlookup` is in flight. Bind it to disable dependent fields. */
    lookupPending?: boolean;
    error?:         string;
    description?:   string;
    disabled?:      boolean;
    required?:      boolean;
    readonly?:      boolean;
    size?:          'sm' | 'md';
    class?:         string;
    name?:          string;
    onblur?:        (e: FocusEvent) => void;
  }

  let {
    value = $bindable(''),
    lookupPending = $bindable(false),
    onlookup,
    onresolve,
    error,
    placeholder = '00000-000',
    ...rest
  }: Props = $props();

  let lookupError = $state<string | undefined>();
  let seq = 0;

  async function lookup(masked: string) {
    const cep = masked.replace(/\D/g, '');
    if (cep.length !== 8 || !onlookup) {
      lookupError = undefined;
      return;
    }
    const mine = ++seq;
    lookupPending = true;
    lookupError = undefined;
    try {
      const address = await onlookup(cep);
      if (mine !== seq) return; // stale response
      if (address) onresolve?.(address);
      else lookupError = t().forms.cepNotFound;
    } catch {
      if (mine === seq) lookupError = t().forms.cepLookupFailed;
    } finally {
      if (mine === seq) lookupPending = false;
    }
  }
</script>

<MaskedField
  {...rest}
  {placeholder}
  mask={maskCEP}
  autocomplete="postal-code"
  error={error ?? lookupError}
  bind:value
  oninput={lookup}
/>
