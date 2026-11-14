<script lang="ts">
  import { untrack } from 'svelte';
  import SegmentedControl from './SegmentedControl.svelte';

  // #1051: four long labels in a phone-width slot (330px).
  let { sizing = 'equal', initial = 'a' }: { sizing?: 'equal' | 'content'; initial?: string } = $props();
  let value = $state(untrack(() => initial));
</script>

<div class="slot">
  <SegmentedControl
    aria-label="Discount"
    fullWidth
    {sizing}
    bind:value
    items={[
      { value: 'a', label: 'A' },
      { value: 'b', label: 'Valor em reais' },
      { value: 'c', label: 'Isenção total' },
      { value: 'd', label: 'Sem desconto (só indicação)' },
    ]}
  />
</div>
<button type="button" onclick={() => (value = 'a')}>Pick first</button>
<button type="button" onclick={() => (value = 'd')}>Pick last</button>

<style>
  .slot {
    width: 330px;
  }
</style>
