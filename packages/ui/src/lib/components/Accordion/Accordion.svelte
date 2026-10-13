<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Accordion } from 'bits-ui';

  interface Props {
    type?: 'single' | 'multiple';
    value?: string | string[];
    onValueChange?: (value: string | string[]) => void;
    class?: string;
    children?: Snippet;
  }

  let { type = 'single', value = $bindable(), onValueChange, class: className = '', children }: Props = $props();
</script>

{#if type === 'multiple'}
  <Accordion.Root
    type="multiple"
    bind:value={() => (Array.isArray(value) ? value : []), (v) => (value = v)}
    {onValueChange}
    class="ca-accordion {className}"
  >
    {@render children?.()}
  </Accordion.Root>
{:else}
  <Accordion.Root
    type="single"
    bind:value={() => (typeof value === 'string' ? value : ''), (v) => (value = v)}
    {onValueChange}
    class="ca-accordion {className}"
  >
    {@render children?.()}
  </Accordion.Root>
{/if}

<style>
  :global(.ca-accordion) {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-1);
    width: 100%;
  }
</style>
