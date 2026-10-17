<script lang="ts">
  // Opt-in: pass `itemMenu={NavItemMenu}` to AppShellLayout to render `NavItem.actions`. Shells
  // without per-item menus do not import it, so DropdownMenu stays out of their bundle.
  import type { Snippet } from 'svelte';
  import { MoreHorizontal } from '@lucide/svelte';
  import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
  import IconButton from '../Button/IconButton.svelte';

  let { label, actions }: { label: string; actions: Snippet } = $props();
</script>

<DropdownMenu align="end" side="bottom">
  {#snippet triggerChild(props)}
    <IconButton variant="text" size="sm" aria-label={label} {...props}>
      <MoreHorizontal size={14} />
    </IconButton>
  {/snippet}
  {@render actions()}
</DropdownMenu>
