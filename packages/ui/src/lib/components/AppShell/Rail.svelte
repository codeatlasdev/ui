<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import type { NavModule } from './types.js';

  interface Props {
    modules:     NavModule[];
    activeIndex: number;
    onSelect:    (index: number) => void;
    /** Brand mark at the top of the rail. Defaults to the "CA" wordmark. */
    brand?:      Snippet;
    /** Items pinned to the bottom of the rail (avatar, notifications, etc.) */
    bottom?:     Snippet;
    class?:      string;
  }

  let { modules, activeIndex, onSelect, brand, bottom, class: className = '' }: Props = $props();

  // Dock magnification: track mouseY, scale icons near cursor
  let mouseY  = $state(Infinity);
  let iconEls = $state<(HTMLElement | null)[]>([]);

  function scaleFor(i: number): number {
    const el = iconEls[i];
    if (!el || !isFinite(mouseY)) return 1;
    const rect   = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const dist   = Math.abs(mouseY - center);
    const maxDist = 72;
    return dist >= maxDist ? 1 : 1 + 0.35 * (1 - dist / maxDist);
  }
</script>

<nav
  class="ca-rail {className}"
  aria-label={t().appShell.moduleNavigation}
  onmousemove={(e) => (mouseY = e.clientY)}
  onmouseleave={() => (mouseY = Infinity)}
>
  <!-- Logo -->
  {#if brand}
    <div class="ca-rail__logo">{@render brand()}</div>
  {:else}
    <div class="ca-rail__logo" aria-hidden="true">
      <span class="ca-rail__logo-mark">CA</span>
    </div>
  {/if}

  <div class="ca-rail__sep" aria-hidden="true"></div>

  <!-- Module icons: flex:1 so they push bottom items down -->
  <ul class="ca-rail__dock" role="list">
    {#each modules as mod, i}
      {@const Icon   = mod.icon}
      {@const active = i === activeIndex}
      <li>
        <button
          class="ca-rail__icon"
          class:ca-rail__icon--active={active}
          aria-label={mod.label}
          aria-current={active ? 'page' : undefined}
          title={mod.label}
          type="button"
          bind:this={iconEls[i]}
          style="--rail-scale:{scaleFor(i)}"
          onclick={() => onSelect(i)}
        >
          {#if active}
            <span class="ca-rail__pip" aria-hidden="true"></span>
          {/if}
          <Icon size={18} stroke-width={active ? 2 : 1.6} />
        </button>
      </li>
    {/each}
  </ul>

  <!-- Bottom slot: avatar, notifications, logout… -->
  {#if bottom}
    <div class="ca-rail__bottom">
      <div class="ca-rail__bottom-sep" aria-hidden="true"></div>
      {@render bottom()}
    </div>
  {/if}
</nav>

<style>
  .ca-rail {
    width: 52px;
    flex-shrink: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    z-index: 1;
    background: var(--ca-glass-bg, oklch(0.14 0 0 / 0.80));
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    backdrop-filter: blur(24px) saturate(180%);
    box-shadow: var(--ca-glass-separator,
      inset -1px 0 0 oklch(1 0 0 / 0.05),
      inset 0 1px 0 oklch(1 0 0 / 0.14),
      0 8px 40px oklch(0 0 0 / 0.50));
  }

  /* ── Logo ─────────────────────────────────────────────────────── */
  .ca-rail__logo {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ca-rail__logo-mark {
    font-size: var(--ca-font-size-body2);
    font-weight: 700;
    letter-spacing: -0.04em;
    color: var(--ca-brand-text);
  }

  .ca-rail__sep {
    width: 28px;
    height: 1px;
    background: var(--ca-outline-subtle);
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  /* ── Module dock ─────────────────────────────────────────────── */
  .ca-rail__dock {
    list-style: none;
    margin: 0;
    padding: 0 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    /* flex:1 pushes the bottom slot to the bottom of the rail */
    flex: 1;
    width: 100%;
    overflow: hidden;
  }

  .ca-rail__dock li { width: 100%; }

  .ca-rail__icon {
    position: relative;
    width: 100%;
    height: 40px;
    border-radius: var(--ca-radius-md);
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--ca-text-hint);
    transition:
      background var(--ca-duration-fast) var(--ca-ease-standard),
      color      var(--ca-duration-fast) var(--ca-ease-standard);
    transform-origin: center;
    transform: scale(var(--rail-scale, 1));
  }

  .ca-rail__icon:hover {
    background: color-mix(in oklab, var(--ca-brand-main) 8%, transparent);
    color: var(--ca-text-primary);
  }

  .ca-rail__icon--active {
    background: color-mix(in oklab, var(--ca-brand-main) 14%, transparent);
    color: var(--ca-brand-text);
  }

  .ca-rail__icon:focus-visible {
    outline: 2px solid var(--ca-brand-main);
    outline-offset: -2px;
  }

  /* Active left-side pip */
  .ca-rail__pip {
    position: absolute;
    left: 1px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 18px;
    border-radius: 999px;
    background: var(--ca-brand-main);
    box-shadow: 0 0 8px var(--ca-glow-primary-strong);
  }

  /* ── Bottom slot ─────────────────────────────────────────────── */
  .ca-rail__bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 6px 8px;
    flex-shrink: 0;
    width: 100%;
    gap: 2px;
  }

  .ca-rail__bottom-sep {
    width: 28px;
    height: 1px;
    background: var(--ca-outline-subtle);
    margin-bottom: 6px;
  }
</style>
