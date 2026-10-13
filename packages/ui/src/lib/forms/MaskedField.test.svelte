<script lang="ts">
  import { untrack } from 'svelte';
  import MaskedField from './MaskedField.svelte';
  import { isValidCPF, maskCPF } from './masks.js';

  interface Props {
    initial?: string;
    onvalue?: (v: string) => void;
  }
  let { initial = '', onvalue }: Props = $props();
  let value = $state(untrack(() => initial));
  $effect(() => onvalue?.(value));
</script>

<MaskedField
  label="CPF"
  mask={maskCPF}
  validate={(v) => (isValidCPF(v) ? undefined : 'Invalid CPF')}
  bind:value
/>
<output data-testid="bound">{value}</output>
