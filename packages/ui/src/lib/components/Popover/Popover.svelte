<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Popover } from 'bits-ui';

  interface Props {
    class?: string;
    /** Non-interactive trigger content (text, icon). Wrapped in the popover's own button. */
    trigger?: Snippet;
    /** Interactive trigger (a Button/IconButton): receives the trigger `props` to spread onto it. */
    triggerChild?: Snippet<[Record<string, unknown>]>;
    children?: Snippet;
    side?:       'top' | 'right' | 'bottom' | 'left';
    align?:      'start' | 'center' | 'end';
    sideOffset?: number;
  }

  let {
    class: className = '',
    trigger,
    triggerChild,
    children,
    side       = 'bottom',
    align      = 'center',
    sideOffset = 8,
  }: Props = $props();
</script>

<Popover.Root>
  {#if triggerChild}
    <Popover.Trigger>
      {#snippet child({ props })}
        {@render triggerChild(props)}
      {/snippet}
    </Popover.Trigger>
  {:else if trigger}
    <Popover.Trigger class="ca-popover__trigger">
      {@render trigger()}
    </Popover.Trigger>
  {/if}
  <Popover.Portal>
    <Popover.Content class="ca-popover-content glass-overlay {className}" {side} {align} sideOffset={sideOffset}>
      {@render children?.()}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>

<style>
  :global(.ca-popover__trigger) {
    display: inline-flex;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  :global(.ca-popover-content) {
    border-radius: var(--ca-radius-lg);
    padding: var(--ca-space-4);
    max-width: 320px;
    z-index: var(--ca-z-dropdown);
    animation: ca-popover-in var(--ca-duration-fast) var(--ca-ease-decelerate);
  }

  :global(.ca-popover-content[data-state='closed']) {
    animation: ca-popover-out var(--ca-duration-fast) var(--ca-ease-standard);
  }

  @keyframes ca-popover-in {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes ca-popover-out {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.96); }
  }
</style>
