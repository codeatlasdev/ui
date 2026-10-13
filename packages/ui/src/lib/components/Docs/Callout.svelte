<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import Alert from '../Alert/Alert.svelte';

  /**
   * Callout: aside block for docs prose. Thin vocabulary layer over `Alert`:
   * note (info), tip (success), caution (warning), danger (error).
   * Keep to two per page.
   */
  type CalloutType = 'note' | 'tip' | 'caution' | 'danger';

  interface Props {
    type?: CalloutType;
    /** Overrides the default title ("Note", "Tip", "Caution", "Danger"). */
    title?: string;
    class?: string;
    children?: Snippet;
  }

  let { type = 'note', title, class: className = '', children }: Props = $props();

  const severity = { note: 'info', tip: 'success', caution: 'warning', danger: 'error' } as const;
</script>

<Alert severity={severity[type]} title={title ?? t().docs.callout[type]} class="ca-callout {className}">
  {@render children?.()}
</Alert>

<style>
  :global(.ca-callout) {
    margin: 1.25rem 0;
  }

  /* Prose inside a callout: tighter, and it must not inherit prose block margins. */
  :global(.ca-callout .ca-alert__content > :first-child) { margin-top: 0; }
  :global(.ca-callout .ca-alert__content > :last-child) { margin-bottom: 0; }
  :global(.ca-callout .ca-alert__content p) { margin: 0.5rem 0; }
</style>
