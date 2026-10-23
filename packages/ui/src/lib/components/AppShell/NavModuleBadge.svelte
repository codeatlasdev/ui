<script lang="ts">
  import type { NavModule } from './types.js';
  import { hasModuleBadge, moduleBadgeText } from './types.js';

  interface Props {
    module: NavModule;
  }

  let { module: mod }: Props = $props();
</script>

<!-- Decorative: the marker is part of the button's accessible name (moduleName), so it is hidden here. -->
{#if hasModuleBadge(mod)}
  <span class="ca-nav-module-badge" class:ca-nav-module-badge--dot={mod.badge === 'dot'} aria-hidden="true">{moduleBadgeText(mod)}</span>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-nav-module-badge {
      position: absolute;
      top: var(--ca-space-0-5);
      /* Sits on the icon's top-right corner, inside the button so overflow never clips it. */
      inset-inline-end: var(--ca-space-1);
      min-width: var(--ca-space-4);
      height: var(--ca-space-4);
      padding: 0 var(--ca-space-1);
      box-sizing: border-box;
      border-radius: var(--ca-radius-round);
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
      font-size: var(--ca-font-size-nano);
      font-weight: var(--ca-font-weight-semibold);
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .ca-nav-module-badge--dot {
      min-width: 0;
      width: var(--ca-space-2);
      height: var(--ca-space-2);
      padding: 0;
      box-shadow: 0 0 var(--ca-space-1) var(--ca-glow-primary-strong);
    }
}
</style>
