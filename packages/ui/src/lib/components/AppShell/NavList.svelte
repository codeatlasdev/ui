<script lang="ts">
  import { getContext } from 'svelte';
  import type { NavItem, NavReorderEvent, NavExtras } from './types.js';
  import { isItemActive } from './types.js';
  import PanelNavItem from './PanelNavItem.svelte';

  interface Props {
    items:       NavItem[];
    pathname:    string;
    /** Makes the list reorderable (needs `reorder={NavReorder}` on AppShellLayout). */
    onReorder?:  (e: NavReorderEvent) => void;
    /** Container id for the drag announcements. */
    label?:      string;
    /** Match a link as active by exact/nested path (Panel's loose items) instead of `isItemActive`. */
    active?:     (item: NavItem) => boolean;
  }

  let { items, pathname, onReorder, label = '', active }: Props = $props();

  const extras = getContext<NavExtras | undefined>('appshell-nav-extras');
  const isActive = (item: NavItem) => (active ? active(item) : isItemActive(item, pathname));
</script>

{#if onReorder && extras?.reorder}
  {@const Reorder = extras.reorder}
  <Reorder {items} {onReorder} {label} {isActive} />
{:else}
  {#each items as item (item.id)}
    <PanelNavItem {item} isActive={isActive(item)} href={item.path} />
  {/each}
{/if}
