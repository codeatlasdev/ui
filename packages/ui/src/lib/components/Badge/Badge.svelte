<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { badge } from '../../i18n/groups/badge.js';
  import type { Snippet } from 'svelte';
  const t = useMessages(badge);

  type Tone = 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

  interface Props {
    count?: number;
    /** Anchored: a plain status dot on the corner. With `tone`: a leading dot inside the pill. */
    dot?: boolean;
    /** Anchored badge colour (`error` is the same hue as `tone="danger"`). Ignored when `tone` is set. */
    color?: 'brand' | 'success' | 'error' | 'warning';
    /**
     * Renders an inline pill (in text flow, children are its label) instead of a corner indicator:
     * `<Badge tone="danger" subtle dot>Overdue</Badge>`.
     */
    tone?: Tone;
    /** Pill only: translucent tinted background with tone-coloured text, instead of a solid fill. */
    subtle?: boolean;
    /** Pill only: `sm` is 20px high, `md` 24px. */
    size?: 'sm' | 'md';
    class?: string;
    children?: Snippet;
  }

  let {
    count,
    dot = false,
    color = 'brand',
    tone,
    subtle = false,
    size = 'sm',
    class: className = '',
    children
  }: Props = $props();

  let showBadge = $derived(dot || (count !== undefined && count > 0));
  let label = $derived(count !== undefined && count > 99 ? '99+' : String(count ?? ''));
</script>

{#if tone}
  <span
    class="ca-badge ca-badge--inline ca-badge--{tone} ca-badge--{size} {className}"
    class:ca-badge--subtle={subtle}
  >
    {#if dot}<span class="ca-badge__dot" aria-hidden="true"></span>{/if}
    {@render children?.()}
  </span>
{:else}
<span class="ca-badge-wrapper {className}">
  {@render children?.()}
  {#if showBadge}
    <span
      class="ca-badge ca-badge--{color}"
      class:ca-badge--dot={dot}
      aria-label={dot ? t().badge.new : t().badge.notifications(count ?? 0)}
      role="status"
    >
      {#if !dot}{label}{/if}
    </span>
  {/if}
</span>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-badge-wrapper {
      position: relative;
      display: inline-flex;
    }

    .ca-badge {
      position: absolute;
      top: 0;
      right: 0;
      transform: translate(25%, -25%);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ca-radius-pill);
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-bold);
      line-height: 1;
      padding: 0 var(--ca-space-1);
      min-width: calc(var(--ca-space-4) + var(--ca-space-0-5));
      height: calc(var(--ca-space-4) + var(--ca-space-0-5));
      border: var(--ca-border-width-strong) solid var(--ca-surface-base);
    }

    .ca-badge--dot {
      width: var(--ca-space-2);
      min-width: var(--ca-space-2);
      height: var(--ca-space-2);
      padding: 0;
      border-radius: 50%;
    }

    .ca-badge--brand {
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
    }

    .ca-badge--success {
      background: var(--ca-semantic-success);
      color: var(--ca-on-semantic);
    }

    .ca-badge--error {
      background: var(--ca-semantic-error);
      color: var(--ca-on-semantic);
    }

    .ca-badge--warning {
      background: var(--ca-semantic-warning);
      color: var(--ca-on-semantic);
    }

    /* Inline pill: in flow, label from children. Tone sets --ca-badge-tone (the text/dot colour in
       the subtle form, the fill in the solid one); `danger` is the error semantic. */
    .ca-badge--inline {
      position: static;
      transform: none;
      display: inline-flex;
      gap: var(--ca-space-1-5);
      width: auto;
      white-space: nowrap;
      vertical-align: middle;
      padding: 0 var(--ca-space-2-5);
      height: calc(var(--ca-space-5) + var(--ca-space-0-5));
      min-width: 0;
      border: none;
      font-weight: var(--ca-font-weight-medium);
    }
    .ca-badge--inline.ca-badge--md {
      height: calc(var(--ca-space-6));
      font-size: var(--ca-font-size-body2);
    }
    .ca-badge--inline.ca-badge--brand { --ca-badge-tone: var(--ca-brand-text); --ca-badge-fill: var(--ca-brand-fill); --ca-badge-on: var(--ca-brand-contrast); }
    .ca-badge--inline.ca-badge--success { --ca-badge-tone: var(--ca-semantic-success); --ca-badge-fill: var(--ca-semantic-success); --ca-badge-on: var(--ca-on-semantic); }
    .ca-badge--inline.ca-badge--danger { --ca-badge-tone: var(--ca-semantic-error); --ca-badge-fill: var(--ca-semantic-error-fill); --ca-badge-on: var(--ca-semantic-error-contrast, var(--ca-on-semantic)); }
    .ca-badge--inline.ca-badge--warning { --ca-badge-tone: var(--ca-semantic-warning); --ca-badge-fill: var(--ca-semantic-warning); --ca-badge-on: var(--ca-on-semantic); }
    .ca-badge--inline.ca-badge--info { --ca-badge-tone: var(--ca-semantic-info); --ca-badge-fill: var(--ca-semantic-info); --ca-badge-on: var(--ca-on-semantic); }
    .ca-badge--inline.ca-badge--neutral { --ca-badge-tone: var(--ca-text-secondary); --ca-badge-fill: var(--ca-text-secondary); --ca-badge-on: var(--ca-surface-base); }
    .ca-badge--inline {
      background: var(--ca-badge-fill);
      color: var(--ca-badge-on);
    }
    .ca-badge--inline.ca-badge--subtle {
      background: color-mix(in oklab, var(--ca-badge-tone) 14%, transparent);
      /* The label is pulled toward the primary text colour so it clears 4.5:1 on its own tint in
         light and dark (the raw semantic hue does not for error and warning); the dot keeps the hue. */
      color: color-mix(in oklab, var(--ca-badge-tone) 65%, var(--ca-text-primary));
    }
    .ca-badge--subtle .ca-badge__dot {
      background: var(--ca-badge-tone);
    }
    .ca-badge--inline.ca-badge--neutral.ca-badge--subtle {
      background: var(--ca-action-hover);
    }
    .ca-badge__dot {
      flex: none;
      width: var(--ca-space-1-5);
      height: var(--ca-space-1-5);
      border-radius: 50%;
      background: currentcolor;
    }
}
</style>
