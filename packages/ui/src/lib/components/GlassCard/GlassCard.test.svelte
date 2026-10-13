<script lang="ts">
  import { createRawSnippet } from 'svelte';
  import GlassCard from './GlassCard.svelte';

  let {
    actionLabel = 'Action',
    ...rest
  }: { actionLabel?: string; [key: string]: unknown } = $props();

  const body = createRawSnippet(() => ({ render: () => `<p>Content</p>` }));
  const actions = $derived(
    createRawSnippet(() => ({ render: () => `<button type="button">${actionLabel}</button>` }))
  );
</script>

<GlassCard {...rest} headerActions={actions} children={body} />
