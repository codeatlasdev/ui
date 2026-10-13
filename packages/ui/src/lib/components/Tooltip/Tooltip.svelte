<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tooltip } from 'bits-ui';

  interface Props {
    content: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    class?: string;
    /** Non-interactive content (text, icon). Wrapped in the tooltip's own button. */
    children?: Snippet;
    /** Interactive target (a Button/IconButton): receives the trigger `props` to spread onto it. */
    triggerChild?: Snippet<[Record<string, unknown>]>;
  }

  let { content, side = 'top', delay = 500, class: className = '', children, triggerChild }: Props = $props();
</script>

<Tooltip.Provider delayDuration={delay}>
  <Tooltip.Root>
    {#if triggerChild}
      <Tooltip.Trigger>
        {#snippet child({ props })}
          {@render triggerChild(props)}
        {/snippet}
      </Tooltip.Trigger>
    {:else}
      <Tooltip.Trigger class="ca-tooltip__trigger">
        {@render children?.()}
      </Tooltip.Trigger>
    {/if}
    <Tooltip.Portal>
      <Tooltip.Content {side} sideOffset={6} role="tooltip" class="ca-tooltip-content {className}">
        {content}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>

<style>
  :global(.ca-tooltip__trigger) {
    display: inline-flex;
    background: transparent;
    border: none;
    padding: 0;
    cursor: inherit;
  }

  :global(.ca-tooltip-content) {
    /* Inverse, near-opaque surface: --ca-tooltip-fg needs it to reach AA in both schemes. */
    background: var(--ca-tooltip-bg);
    -webkit-backdrop-filter: var(--ca-blur-ultra-thin);
    backdrop-filter: var(--ca-blur-ultra-thin);
    border: var(--ca-border-width) solid var(--ca-glass-border);
    border-radius: var(--ca-radius-sm);
    padding: var(--ca-space-1-5) var(--ca-space-2-5);
    font-size: var(--ca-font-size-caption);
    color: var(--ca-tooltip-fg);
    max-width: 240px;
    z-index: var(--ca-z-tooltip);
    box-shadow: var(--ca-shadow-md);
    animation: ca-tooltip-in var(--ca-duration-fast) var(--ca-ease-decelerate);
    line-height: var(--ca-line-height-body);
  }

  :global(.ca-tooltip-content[data-state='closed']) {
    animation: ca-tooltip-out var(--ca-duration-fast) var(--ca-ease-standard);
  }

  @keyframes ca-tooltip-in {
    from { opacity: 0; transform: scale(0.94); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes ca-tooltip-out {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.94); }
  }
</style>
