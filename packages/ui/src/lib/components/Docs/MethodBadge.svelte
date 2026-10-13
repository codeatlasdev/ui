<script lang="ts">
  /**
   * MethodBadge: HTTP method label (GET/POST/PUT/PATCH/DELETE), mono, semantic colour.
   * `variant="plain"` drops the tinted pill (for tight lists like a sidebar).
   */
  interface Props {
    method: string;
    variant?: 'pill' | 'plain';
    class?: string;
  }

  let { method, variant = 'pill', class: className = '' }: Props = $props();
</script>

<span class="ca-method ca-method--{variant} {className}" data-method={method.toUpperCase()}>{method}</span>

<style>
  .ca-method {
    flex-shrink: 0;
    font-family: var(--ca-font-mono);
    font-size: var(--ca-font-size-caption);
    font-weight: var(--ca-font-weight-bold);
    line-height: var(--ca-line-height-relaxed);
    letter-spacing: var(--ca-label-tracking);
    color: var(--ca-semantic-info);
  }

  .ca-method--pill {
    padding: var(--ca-space-0-5) var(--ca-space-2);
    border-radius: var(--ca-radius-xs);
    background: color-mix(in oklab, currentColor 6%, transparent);
  }

  .ca-method--plain {
    font-size: var(--ca-font-size-nano);
    font-weight: var(--ca-font-weight-semibold);
    line-height: var(--ca-line-height-prose);
  }

  .ca-method[data-method='POST'] { color: var(--ca-semantic-success); }
  .ca-method[data-method='PUT'],
  .ca-method[data-method='PATCH'] { color: var(--ca-semantic-warning); }
  .ca-method[data-method='DELETE'] { color: var(--ca-semantic-error); }
</style>
