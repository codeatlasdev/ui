<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  interface Props {
    class?: string;
    /** Non-interactive trigger content (text, icon). Wrapped in the menu's own button. */
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
    align      = 'start',
    sideOffset = 6,
  }: Props = $props();
</script>

<DropdownMenu.Root>
  {#if triggerChild}
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        {@render triggerChild(props)}
      {/snippet}
    </DropdownMenu.Trigger>
  {:else if trigger}
    <DropdownMenu.Trigger class="ca-dropdown__trigger">
      {@render trigger()}
    </DropdownMenu.Trigger>
  {/if}
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="ca-dropdown-content glass-overlay {className}" {side} {align} sideOffset={sideOffset}>
      {@render children?.()}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
  :global(.ca-dropdown__trigger) {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 0;
  }

  :global(.ca-dropdown-content) {
    border-radius: var(--ca-radius-lg);
    padding: var(--ca-space-1);
    min-width: 160px;
    z-index: var(--ca-z-dropdown);
    animation: ca-dropdown-in var(--ca-duration-fast) var(--ca-ease-decelerate);
    transform-origin: var(--bits-dropdown-menu-content-transform-origin, top left);
  }

  :global(.ca-dropdown-content[data-state='closed']) {
    animation: ca-dropdown-out var(--ca-duration-fast) var(--ca-ease-standard);
  }

  @keyframes ca-dropdown-in {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes ca-dropdown-out {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.96); }
  }
</style>
