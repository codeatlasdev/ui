<script lang="ts">
  import TextField from './TextField.svelte';

  let { ...rest }: { [key: string]: unknown } = $props();
  let ref = $state<HTMLInputElement | null>(null);
</script>

<TextField bind:ref {...rest} />
<output data-testid="ref-tag">{ref?.tagName ?? 'none'}</output>
<button type="button" onclick={() => ref?.focus()}>focus</button>
