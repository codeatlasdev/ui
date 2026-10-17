<script lang="ts">
  import { getContext } from 'svelte';
  import { GripVertical } from '@lucide/svelte';
  import { useT } from '../../i18n/state.svelte.js';
  import type { NavExtras, NavItem } from './types.js';
  const t = useT();
  const extras = getContext<NavExtras | undefined>('appshell-nav-extras');

  interface Props {
    item:     NavItem;
    isActive: boolean;
    href:     string;
    /** Adds the drag grip (the list this row sits in is reorderable). Set by `SectionGroup`/`Panel`. */
    grip?:    boolean;
    /** `id` of the node that describes the keyboard drag (`dnd.instructionsId`). */
    describedby?: string;
    class?:   string;
  }

  let { item, isActive, href, grip = false, describedby, class: className = '' }: Props = $props();

  /** 1200 -> `1.2k`; below 1000 as is. The full number stays in the accessible name. */
  function compact(n: number): string {
    if (n < 1000) return String(n);
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}k`;
  }
</script>

<!--
  The row is a box with the link inside it: a link cannot contain the actions button or the grip,
  so those are siblings of the <a>. The <a> fills the row and carries the name and aria-current.
-->
<div
  class="ca-nav-item {className}"
  class:ca-nav-item--active={isActive}
  class:ca-nav-item--grip={grip}
  data-dnd-item={grip ? item.id : undefined}
>
  {#if isActive}
    <span class="ca-nav-item__pip" aria-hidden="true"></span>
  {/if}
  {#if grip}
    <button
      type="button"
      class="ca-nav-item__grip"
      aria-label={t().appShell.moveItem(item.label)}
      aria-describedby={describedby}
    >
      <GripVertical size={14} aria-hidden="true" />
    </button>
  {/if}
  <a
    {href}
    class="ca-nav-item__link"
    aria-current={isActive ? 'page' : undefined}
  >
    {#if item.leading}
      <span class="ca-nav-item__leading" aria-hidden="true">{@render item.leading()}</span>
    {:else}
      <item.icon
        size={16}
        stroke-width={isActive ? 2 : 1.6}
        class="ca-nav-item__icon"
      />
    {/if}
    {#if item.color}
      <span class="ca-nav-item__color" style="--ca-nav-color:{item.color}" aria-hidden="true"></span>
    {/if}
    <span class="ca-nav-item__label">{item.label}</span>
    {#if item.count !== undefined && item.count >= 0}
      <span class="ca-nav-item__count" aria-hidden="true">{compact(item.count)}</span>
      <span class="ca-sr-only">{item.count}</span>
    {/if}
    {#if item.badge && item.badge > 0}
      <span class="ca-nav-item__badge" aria-label={t().appShell.unread(item.badge)}>
        {item.badge > 99 ? '99+' : item.badge}
      </span>
    {/if}
    {#if item.isNew}
      <span class="ca-nav-item__dot" aria-label={t().appShell.new}></span>
    {/if}
  </a>
  {#if item.actions && extras?.itemMenu}
    {@const Menu = extras.itemMenu}
    <span class="ca-nav-item__actions">
      <Menu label={t().appShell.itemActions(item.label)} actions={item.actions} />
    </span>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--ca-space-1);
      padding: 0 var(--ca-space-1) 0 0;
      height: var(--ca-control-height);
      border-radius: var(--ca-radius-md);
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-regular);
      letter-spacing: var(--ca-label-tracking);
      color: var(--ca-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color var(--ca-duration-fast) var(--ca-ease-standard),
        transform var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-nav-item:hover:not(.ca-nav-item--active) {
      background: var(--ca-action-hover);
      color: var(--ca-text-primary);
      transform: translateX(var(--ca-border-width));
    }
    .ca-nav-item--active {
      background: var(--ca-action-selected);
      color: var(--ca-text-primary);
      font-weight: var(--ca-font-weight-medium);
      box-shadow:
        inset 0 var(--ca-border-width) 0 var(--ca-glass-rim),
        0 0 var(--ca-space-2-5) var(--ca-glow-primary);
    }
    /* The link fills the row; the row owns the box, hover and active look. */
    .ca-nav-item__link {
      flex: 1;
      min-width: 0;
      align-self: stretch;
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      padding: 0 var(--ca-space-1-5) 0 var(--ca-space-3-5);
      border-radius: inherit;
      color: inherit;
      text-decoration: none;
    }
    .ca-nav-item--grip .ca-nav-item__link {
      padding-left: var(--ca-space-1);
    }
    .ca-nav-item__link:focus-visible,
    .ca-nav-item__grip:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(var(--ca-border-width-focus) * -1);
    }

    /* Per-item marker dot (NavItem.color) */
    .ca-nav-item__color {
      flex-shrink: 0;
      width: var(--ca-space-2);
      height: var(--ca-space-2);
      border-radius: var(--ca-radius-round);
      background: var(--ca-nav-color);
    }
    .ca-nav-item__leading {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: var(--ca-space-4);
    }

    /* Neutral count (NavItem.count): plain text, no fill, so it never reads as an unread badge */
    .ca-nav-item__count {
      flex-shrink: 0;
      font-size: var(--ca-font-size-micro);
      font-variant-numeric: tabular-nums;
      color: var(--ca-text-hint);
    }

    /* Grip (reorderable list) and the "…" actions button: revealed on hover/focus, always on touch */
    .ca-nav-item__grip {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      align-self: stretch;
      width: var(--ca-space-4);
      padding: 0;
      border: none;
      background: transparent;
      color: var(--ca-text-hint);
      border-radius: var(--ca-radius-sm);
      cursor: grab;
      touch-action: none;
      opacity: 0;
      transition: opacity var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-nav-item__actions {
      flex-shrink: 0;
      display: inline-flex;
      opacity: 0;
      transition: opacity var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-nav-item:hover .ca-nav-item__grip,
    .ca-nav-item:hover .ca-nav-item__actions,
    .ca-nav-item:focus-within .ca-nav-item__grip,
    .ca-nav-item:focus-within .ca-nav-item__actions,
    .ca-nav-item__actions:has(:global([aria-expanded='true'])) {
      opacity: 1;
    }
    @media (hover: none) {
      .ca-nav-item__grip,
      .ca-nav-item__actions { opacity: 1; }
    }

    /* Left pip, only on active */
    .ca-nav-item__pip {
      position: absolute;
      left: var(--ca-space-0-5);
      top: 50%;
      transform: translateY(-50%);
      width: var(--ca-space-1);
      height: var(--ca-space-4);
      border-radius: var(--ca-radius-round);
      background: var(--ca-brand-main);
      box-shadow: 0 0 var(--ca-space-1-5) var(--ca-glow-primary-strong);
    }

    :global(.ca-nav-item__icon) {
      flex-shrink: 0;
      color: inherit;
      opacity: 0.65;
    }
    .ca-nav-item--active :global(.ca-nav-item__icon) {
      opacity: 1;
      color: var(--ca-brand-text);
    }

    .ca-nav-item__label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ca-nav-item__badge {
      flex-shrink: 0;
      min-width: var(--ca-space-4);
      height: var(--ca-space-4);
      padding: 0 var(--ca-space-1);
      border-radius: var(--ca-radius-round);
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
      font-size: var(--ca-font-size-nano);
      font-weight: var(--ca-font-weight-semibold);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ca-nav-item__dot {
      width: var(--ca-space-1-5);
      height: var(--ca-space-1-5);
      border-radius: var(--ca-radius-round);
      background: var(--ca-brand-main);
      box-shadow: 0 0 var(--ca-space-1) var(--ca-glow-primary-strong);
      flex-shrink: 0;
    }

    /* Light mode overrides */
    :global(:root:not(.dark)) .ca-nav-item:hover:not(.ca-nav-item--active) {
      background: var(--ca-action-hover);
    }
    :global(:root:not(.dark)) .ca-nav-item--active {
      background: var(--ca-action-selected);
      box-shadow:
        inset 0 var(--ca-border-width) 0 var(--ca-glass-rim),
        inset 0 0 0 var(--ca-border-width) var(--ca-glass-rim);
    }
}
</style>
