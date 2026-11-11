<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { toast as toastMessages } from '../../i18n/groups/toast.js';
  import { toast } from '../../stores/toast.svelte.js';
  import ToastItem from './ToastItem.svelte';
  const t = useMessages(toastMessages);

  interface Props {
    /** Stack inside the nearest positioned ancestor (`position: absolute`) instead of the viewport, so it follows a `data-preset` island. Default false. */
    inline?: boolean;
  }
  let { inline = false }: Props = $props();
</script>

<div class="ca-toaster" class:ca-toaster--inline={inline} role="region" aria-live="polite" aria-label={t().toast.region}>
  {#each toast.items as item (item.id)}
    <ToastItem
      {item}
      onclose={() => toast.remove(item.id)}
      onpause={() => toast.pause(item.id)}
      onresume={() => toast.resume(item.id)}
    />
  {/each}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-toaster {
      position: fixed;
      /* --ca-toaster-bottom moves the stack (a fixed footer of your own); a phone with a BottomNav lifts it above
         the bar on its own (#722). */
      bottom: var(--ca-toaster-bottom, var(--ca-space-6));
      right: var(--ca-space-6);
      z-index: var(--ca-z-snackbar);
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-2);
      pointer-events: none;
      max-width: 380px;
      width: calc(100vw - 2 * var(--ca-space-6));
    }
    @media (max-width: 899.98px) {
      :global(body:has(.ca-bottom-nav)) .ca-toaster {
        bottom: var(--ca-toaster-bottom, calc(var(--ca-bottom-nav-h) + var(--ca-safe-bottom) + var(--ca-space-3)));
      }
    }
    .ca-toaster.ca-toaster--inline {
      position: absolute;
      width: calc(100% - 2 * var(--ca-space-6));
    }
}
</style>
