<script lang="ts">
  import TextArea from './TextArea.svelte';

  let { ...rest }: { [key: string]: unknown } = $props();
  let ref = $state<HTMLTextAreaElement | null>(null);
</script>

<TextArea bind:ref {...rest} />
<output data-testid="ref-tag">{ref?.tagName ?? 'none'}</output>
