<script lang="ts">
  import { createRawSnippet } from 'svelte';
  import Card from './Card.svelte';

  let {
    actionLabel = 'Action',
    ...rest
  }: { actionLabel?: string; [key: string]: unknown } = $props();

  const body = createRawSnippet(() => ({ render: () => `<p>Content</p>` }));
  const actions = $derived(
    createRawSnippet(() => ({ render: () => `<button type="button">${actionLabel}</button>` }))
  );
</script>

<Card {...rest} headerActions={actions} children={body} />
