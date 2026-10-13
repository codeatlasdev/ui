<script lang="ts">
  import { untrack } from 'svelte';
  import MoneyInput from './MoneyInput.svelte';

  interface Props {
    initial?: number;
    min?: number;
    max?: number;
    allowNegative?: boolean;
    onchange?: (cents: number) => void;
  }
  let { initial = 0, min, max, allowNegative = false, onchange }: Props = $props();
  let value = $state(untrack(() => initial));
</script>

<MoneyInput label="Amount" bind:value {min} {max} {allowNegative} {onchange} />
<output data-testid="bound">{value}</output>
<button type="button" onclick={() => (value = 5000)}>set 50</button>
