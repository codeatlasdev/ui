<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import { Moon, Sun } from '@lucide/svelte';
  import { colorScheme } from '../../stores/color-scheme.svelte.js';
  const t = useT();

  interface Props {
    /** Accessible name and tooltip. */
    label?: string;
    size?:  number;
    class?: string;
  }

  let { label, size = 18, class: className = '' }: Props = $props();
</script>

<!-- Icon visibility follows the .dark class (set before paint by the theme
     script), not store state, so SSR output always matches the client. -->
<button
  type="button"
  class="ca-rail-btn ca-theme-toggle {className}"
  aria-label={label ?? t().themeToggle.label}
  title={label ?? t().themeToggle.label}
  onclick={() => colorScheme.toggle()}
>
  <span class="ca-theme-toggle__icon ca-theme-toggle__icon--light"><Moon {size} /></span>
  <span class="ca-theme-toggle__icon ca-theme-toggle__icon--dark"><Sun {size} /></span>
</button>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-theme-toggle__icon {
      display: flex;
    }

    .ca-theme-toggle__icon--dark,
    :global(.dark) .ca-theme-toggle__icon--light {
      display: none;
    }

    :global(.dark) .ca-theme-toggle__icon--dark {
      display: flex;
    }
}
</style>
