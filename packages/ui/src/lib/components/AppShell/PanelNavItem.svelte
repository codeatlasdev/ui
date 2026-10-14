<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import type { NavItem } from './types.js';
  const t = useT();

  interface Props {
    item:     NavItem;
    isActive: boolean;
    href:     string;
    class?:   string;
  }

  let { item, isActive, href, class: className = '' }: Props = $props();
</script>

<a
  {href}
  class="ca-nav-item {className}"
  class:ca-nav-item--active={isActive}
  aria-current={isActive ? 'page' : undefined}
>
  {#if isActive}
    <span class="ca-nav-item__pip" aria-hidden="true"></span>
  {/if}
  <item.icon
    size={16}
    stroke-width={isActive ? 2 : 1.6}
    class="ca-nav-item__icon"
  />
  <span class="ca-nav-item__label">{item.label}</span>
  {#if item.badge && item.badge > 0}
    <span class="ca-nav-item__badge" aria-label={t().appShell.unread(item.badge)}>
      {item.badge > 99 ? '99+' : item.badge}
    </span>
  {/if}
  {#if item.isNew}
    <span class="ca-nav-item__dot" aria-label={t().appShell.new}></span>
  {/if}
</a>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      padding: 0 var(--ca-space-2-5) 0 var(--ca-space-3-5);
      height: var(--ca-control-height);
      border-radius: var(--ca-radius-md);
      text-decoration: none;
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
    .ca-nav-item:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(var(--ca-border-width-focus) * -1);
    }

    /* Left pip, only on active */
    .ca-nav-item__pip {
      position: absolute;
      left: var(--ca-space-0-5);
      top: 50%;
      transform: translateY(-50%);
      width: var(--ca-space-1);
      height: var(--ca-space-4);
      border-radius: var(--ca-radius-pill);
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
      border-radius: var(--ca-radius-pill);
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
      border-radius: 50%;
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
