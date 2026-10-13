<script lang="ts">
  import { ScrollArea as BitsScrollArea } from 'bits-ui';
  import type { Snippet } from 'svelte';

  interface Props {
    type?: 'hover' | 'scroll' | 'auto' | 'always';
    orientation?: 'vertical' | 'horizontal' | 'both';
    maxHeight?: string;
    maxWidth?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    type = 'hover',
    orientation = 'vertical',
    maxHeight,
    maxWidth,
    class: className = '',
    children,
  }: Props = $props();

  let style = $derived(
    [maxHeight && `max-height:${maxHeight}`, maxWidth && `max-width:${maxWidth}`]
      .filter(Boolean)
      .join(';')
  );
</script>

<BitsScrollArea.Root
  {type}
  class="ca-scroll-area {className}"
  {style}
>
  <!-- Always a scroll region: focusable so keyboard users can scroll it (axe scrollable-region-focusable). -->
  <BitsScrollArea.Viewport class="ca-scroll-area__viewport" tabindex={0}>
    {@render children?.()}
  </BitsScrollArea.Viewport>

  {#if orientation === 'vertical' || orientation === 'both'}
    <BitsScrollArea.Scrollbar orientation="vertical" class="ca-scroll-area__scrollbar ca-scroll-area__scrollbar--v">
      <BitsScrollArea.Thumb class="ca-scroll-area__thumb" />
    </BitsScrollArea.Scrollbar>
  {/if}

  {#if orientation === 'horizontal' || orientation === 'both'}
    <BitsScrollArea.Scrollbar orientation="horizontal" class="ca-scroll-area__scrollbar ca-scroll-area__scrollbar--h">
      <BitsScrollArea.Thumb class="ca-scroll-area__thumb" />
    </BitsScrollArea.Scrollbar>
  {/if}

  <BitsScrollArea.Corner />
</BitsScrollArea.Root>

<style>
  :global(.ca-scroll-area) {
    position: relative;
    overflow: hidden;
  }

  /* max-height/-width inherit from the root: height:100% against an auto-height
     root resolves to auto, which would clip the content instead of scrolling it. */
  :global(.ca-scroll-area__viewport) {
    width: 100%;
    height: 100%;
    max-height: inherit;
    max-width: inherit;
    overflow: scroll;
  }

  :global(.ca-scroll-area__viewport::-webkit-scrollbar) {
    display: none;
  }

  :global(.ca-scroll-area__scrollbar) {
    display: flex;
    user-select: none;
    touch-action: none;
    padding: var(--ca-space-0-5);
    background: transparent;
    transition: background var(--ca-duration-fast) var(--ca-ease-decelerate);
  }

  :global(.ca-scroll-area__scrollbar--v) {
    width: var(--ca-space-2);
    flex-direction: column;
  }

  :global(.ca-scroll-area__scrollbar--h) {
    height: var(--ca-space-2);
    flex-direction: row;
  }

  :global(.ca-scroll-area__scrollbar:hover) {
    background: var(--ca-glass-tint-regular);
  }

  :global(.ca-scroll-area__thumb) {
    flex: 1;
    border-radius: var(--ca-radius-pill);
    background: var(--ca-outline-default);
    position: relative;
    cursor: pointer;
  }

  :global(.ca-scroll-area__thumb:hover) {
    background: var(--ca-text-hint);
  }
</style>
