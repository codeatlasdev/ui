<script lang="ts">
  interface Props {
    status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    label: string;
    class?: string;
  }

  let { status, label, class: className = '' }: Props = $props();
</script>

<span class="ca-status-chip ca-status-chip--{status} {className}" role="status">
  <span class="ca-status-chip__label">{label}</span>
</span>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-status-chip {
      display: inline-flex;
      align-items: center;
      height: calc(var(--ca-space-5) + var(--ca-space-0-5));
      border-radius: var(--ca-radius-pill);
      padding: 0 var(--ca-space-2);
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-medium);
      line-height: 1;
      /* A single-line pill like the inline Badge (#1232): never wraps out of its fixed height. In a cell
         narrower than the label it shrinks to the cell and ends the label with an ellipsis. */
      white-space: nowrap;
      flex: none;
      max-width: 100%;
      min-width: 0;
    }

    .ca-status-chip__label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ca-status-chip--success {
      color: var(--ca-semantic-success-fg, var(--ca-semantic-success));
      background: var(--ca-semantic-success-muted, color-mix(in oklab, var(--ca-semantic-success) 8%, transparent));
    }

    .ca-status-chip--warning {
      color: var(--ca-semantic-warning-fg, var(--ca-semantic-warning));
      background: var(--ca-semantic-warning-muted, color-mix(in oklab, var(--ca-semantic-warning) 8%, transparent));
    }

    .ca-status-chip--error {
      color: var(--ca-semantic-error-fg, var(--ca-semantic-error));
      background: var(--ca-semantic-error-muted, color-mix(in oklab, var(--ca-semantic-error) 8%, transparent));
    }

    .ca-status-chip--info {
      color: var(--ca-semantic-info-fg, var(--ca-semantic-info));
      background: var(--ca-semantic-info-muted, color-mix(in oklab, var(--ca-semantic-info) 8%, transparent));
    }

    .ca-status-chip--neutral {
      color: var(--ca-text-secondary);
      background: var(--ca-action-hover);
    }
}
</style>
