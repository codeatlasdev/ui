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
    font: 700 var(--ca-font-size-caption) / 1.5 var(--ca-font-mono);
    letter-spacing: 0.02em;
    color: var(--ca-semantic-info);
  }

  .ca-method--pill {
    padding: 0.125rem 0.5rem;
    border-radius: var(--ca-radius-xs);
    background: color-mix(in oklab, currentColor 6%, transparent);
  }

  .ca-method--plain {
    font-size: var(--ca-font-size-nano);
    font-weight: 600;
    line-height: 1.6;
  }

  .ca-method[data-method='POST'] { color: var(--ca-semantic-success); }
  .ca-method[data-method='PUT'],
  .ca-method[data-method='PATCH'] { color: var(--ca-semantic-warning); }
  .ca-method[data-method='DELETE'] { color: var(--ca-semantic-error); }
</style>
