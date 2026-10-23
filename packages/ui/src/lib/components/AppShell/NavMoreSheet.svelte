<script lang="ts">
  // Opt-in: pass `moreSheet={NavMoreSheet}` to AppShellLayout to get the "More" tab when there are more
  // modules than `bottomNavPrimary`. Shells that do not import it keep Sheet out of their bundle.
  import type { Snippet } from 'svelte';
  import Sheet from '../Sheet/Sheet.svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { appShell } from '../../i18n/groups/appShell.js';
  import NavModuleBadge from './NavModuleBadge.svelte';
  import type { NavModule } from './types.js';
  import { moduleName } from './types.js';
  const t = useMessages(appShell);

  interface Props {
    open:         boolean;
    title:        string;
    /** Modules that did not fit on the bar. */
    rest:         NavModule[];
    /** Index of `rest[0]` inside the full module list. */
    visibleCount: number;
    activeIndex:  number;
    overflow?:    Snippet;
    onPick:       (index: number) => void;
  }

  let { open = $bindable(false), title, rest, visibleCount, activeIndex, overflow, onPick }: Props = $props();
  const name = (mod: NavModule) => moduleName(mod, { unread: t().appShell.unread, fresh: t().appShell.new });
</script>

<Sheet bind:open {title}>
  <ul class="ca-bottom-nav__more" role="list">
    {#each rest as mod, j}
      {@const i = visibleCount + j}
      <li>
        <button
          class="ca-bottom-nav__more-btn"
          class:ca-bottom-nav__more-btn--active={i === activeIndex}
          type="button"
          aria-label={name(mod)}
          aria-current={i === activeIndex ? 'page' : undefined}
          onclick={() => onPick(i)}
        >
          <span class="ca-bottom-nav__more-icon">
            <mod.icon size={22} stroke-width={i === activeIndex ? 2 : 1.5} />
            <NavModuleBadge module={mod} />
          </span>
          <span class="ca-bottom-nav__more-label">{mod.label}</span>
        </button>
      </li>
    {/each}
  </ul>
  {#if overflow}
    <div class="ca-bottom-nav__more-extra">{@render overflow()}</div>
  {/if}
</Sheet>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* "More" sheet: modules that did not fit on the bar, in a 3-column grid. */
    .ca-bottom-nav__more {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--ca-space-2);
    }

    .ca-bottom-nav__more-btn {
      width: 100%;
      min-height: var(--ca-touch-target);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-1);
      padding: var(--ca-space-3) var(--ca-space-1);
      border: none;
      border-radius: var(--ca-radius-md);
      background: transparent;
      color: var(--ca-text-secondary);
      cursor: pointer;
    }

    .ca-bottom-nav__more-btn--active {
      background: color-mix(in oklab, var(--ca-brand-main) 14%, transparent);
      color: var(--ca-brand-text);
    }

    .ca-bottom-nav__more-btn:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(var(--ca-border-width-focus) * -1);
    }

    .ca-bottom-nav__more-label {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-medium);
    }

    .ca-bottom-nav__more-extra {
      margin-top: var(--ca-space-4);
    }

    .ca-bottom-nav__more-icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
}
</style>
