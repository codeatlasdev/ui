<script lang="ts">
  import { untrack } from 'svelte';
  import Checkbox from './Checkbox.svelte';

  let { initial = false, ...rest }: { initial?: boolean; [key: string]: unknown } = $props();
  let checked = $state(untrack(() => initial));
  let ref = $state<HTMLInputElement | null>(null);
</script>

<Checkbox bind:checked bind:ref {...rest} />
<output data-testid="bound">{String(checked)}</output>
<output data-testid="ref-tag">{ref?.tagName ?? 'none'}</output>
