<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import type { NavModule } from './types.js';
  const t = useT();

  interface Props {
    modules: NavModule[];
    activeIndex: number;
    onSelect: (index: number) => void;
    class?: string;
  }

  let { modules, activeIndex, onSelect, class: className = '' }: Props = $props();

  let visible = $derived(modules.slice(0, 5));
</script>

<nav class="ca-bottom-nav glass-chrome-layer {className}" aria-label={t().appShell.moduleNavigation}>
  {#each visible as mod, i}
    <button
      class="ca-bottom-nav__btn"
      class:ca-bottom-nav__btn--active={i === activeIndex}
      type="button"
      aria-label={mod.label}
      aria-current={i === activeIndex ? 'page' : undefined}
      onclick={() => onSelect(i)}
    >
      <span class="ca-bottom-nav__icon">
        <mod.icon size={22} stroke-width={i === activeIndex ? 2 : 1.5} />
      </span>
      <span class="ca-bottom-nav__label">{mod.label}</span>
    </button>
  {/each}
</nav>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      /* The bar's own background runs through the home-indicator inset: no dark band below it. */
      box-sizing: border-box;
      height: calc(var(--ca-bottom-nav-h) + var(--ca-safe-bottom));
      padding: 0 var(--ca-safe-right) var(--ca-safe-bottom) var(--ca-safe-left);
      display: none;
      flex-direction: row;
      align-items: stretch;
      z-index: var(--ca-z-nav);
      /* Opaque so the safe-area strip matches the bar and Safari 26 tints its toolbar
         from it (it samples background-color of fixed edge elements, not images). */
      background-color: var(--ca-chrome-surface);
      box-shadow: inset 0 var(--ca-border-width) 0 var(--ca-outline-subtle);
    }

    @media (max-width: 899.98px) {
      .ca-bottom-nav {
        display: flex;
      }
    }

    .ca-bottom-nav__btn {
      /* Equal columns that may shrink below content width, so 5 items fit at 320px. */
      flex: 1 1 0;
      min-width: 0;
      min-height: var(--ca-touch-target);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-1);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--ca-text-secondary);
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
      padding: 0 var(--ca-space-0-5);
      -webkit-tap-highlight-color: transparent;
    }

    .ca-bottom-nav__btn--active {
      color: var(--ca-brand-text);
    }

    .ca-bottom-nav__btn:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(var(--ca-border-width-focus) * -1);
    }

    .ca-bottom-nav__icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ca-bottom-nav__label {
      display: block;
      max-width: 100%;
      /* 11px floor: tab labels are read at arm length, never shrunk "to fit". */
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-medium);
      line-height: var(--ca-line-height-tight);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
}
</style>
