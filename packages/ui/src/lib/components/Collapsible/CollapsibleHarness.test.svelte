<script lang="ts">
  import Collapsible from './Collapsible.svelte';

  let {
    open = $bindable(false),
    disabled = false,
  }: { open?: boolean; disabled?: boolean } = $props();
</script>

<Collapsible title="Details" bind:open {disabled}>Collapsible content</Collapsible>

<output data-testid="open">{String(open)}</output>
