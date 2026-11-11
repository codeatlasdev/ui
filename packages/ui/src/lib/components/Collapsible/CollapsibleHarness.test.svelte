<script lang="ts">
  import Collapsible from './Collapsible.svelte';

  let {
    open = $bindable(false),
    disabled = false,
    variant,
    divided,
  }: {
    open?: boolean;
    disabled?: boolean;
    variant?: 'boxed' | 'flush';
    divided?: boolean;
  } = $props();
</script>

<Collapsible title="Details" bind:open {disabled} {variant} {divided}>Collapsible content</Collapsible>

<output data-testid="open">{String(open)}</output>
