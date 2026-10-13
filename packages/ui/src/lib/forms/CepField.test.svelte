<script lang="ts">
  import CepField from './CepField.svelte';
  import type { CepAddress } from './types.js';

  interface Props {
    onlookup?: (cep: string) => Promise<CepAddress | null>;
    onresolve?: (a: CepAddress) => void;
  }
  let { onlookup, onresolve }: Props = $props();
  let value = $state('');
  let pending = $state(false);
  let street = $state('');
</script>

<CepField
  label="CEP"
  bind:value
  bind:lookupPending={pending}
  {onlookup}
  onresolve={(a) => {
    street = a.logradouro;
    onresolve?.(a);
  }}
/>
<output data-testid="bound">{value}</output>
<output data-testid="pending">{pending}</output>
<input aria-label="Street" bind:value={street} disabled={pending} />
