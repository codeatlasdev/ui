<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import type { NavItem } from './types.js';

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
  .ca-nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 10px 0 14px;
    height: 34px;
    border-radius: var(--ca-radius-md);
    text-decoration: none;
    font-size: var(--ca-font-size-body2);
    font-weight: 400;
    letter-spacing: -0.008em;
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
    transform: translateX(1px);
  }
  .ca-nav-item--active {
    background: var(--ca-action-selected);
    color: var(--ca-text-primary);
    font-weight: 500;
    box-shadow:
      inset 0 1px 0 oklch(1 0 0 / 0.18),
      0 0 10px var(--ca-glow-primary);
  }
  .ca-nav-item:focus-visible {
    outline: 2px solid var(--ca-brand-main);
    outline-offset: -2px;
  }

  /* Left pip, only on active */
  .ca-nav-item__pip {
    position: absolute;
    left: 2px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 16px;
    border-radius: 999px;
    background: var(--ca-brand-main);
    box-shadow: 0 0 6px var(--ca-glow-primary-strong);
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
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    font-size: var(--ca-font-size-nano);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ca-nav-item__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ca-brand-main);
    box-shadow: 0 0 4px var(--ca-glow-primary-strong);
    flex-shrink: 0;
  }

  /* Light mode overrides */
  :global(:root:not(.dark)) .ca-nav-item:hover:not(.ca-nav-item--active) {
    background: var(--ca-action-hover);
  }
  :global(:root:not(.dark)) .ca-nav-item--active {
    background: var(--ca-action-selected);
    box-shadow:
      inset 0 1px 0 oklch(1 0 0 / 0.90),
      inset 0 0 0 1px oklch(1 0 0 / 0.40);
  }
</style>
