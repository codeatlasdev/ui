<script lang="ts">
  /**
   * RecordRow: one record inside a `RecordList`. `identity` is the first column (name, avatar),
   * the children are the `RecordCell`s, `actions` is the last column (a row menu). See `RecordList`.
   */
  import type { Snippet } from 'svelte';
  import type { HTMLLiAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLLiAttributes, 'class' | 'children'> {
    /** First column: what the record is. Heads the stacked row. */
    identity: Snippet;
    /** Last column: a menu or button. Its cell is at least 44px square. */
    actions?: Snippet;
    class?: string;
    /** The `RecordCell`s, in the order of the `columns` tracks. */
    children?: Snippet;
  }

  let { identity, actions, class: className = '', children, ...rest }: Props = $props();
</script>

<li class="ca-record-row {className}" {...rest}>
  <div class="ca-record-row__identity">{@render identity()}</div>
  {#if children}
    <dl class="ca-record-row__cells">{@render children()}</dl>
  {/if}
  {#if actions}
    <div class="ca-record-row__actions">{@render actions()}</div>
  {/if}
</li>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-record-row {
      display: grid;
      grid-template-columns: var(--ca-record-columns);
      align-items: center;
      column-gap: var(--ca-space-4);
      padding: var(--ca-space-2) var(--ca-space-4);
      min-height: var(--ca-touch-target);
      border-top: var(--ca-border-width) solid var(--ca-outline-subtle);
      min-width: 0;
    }
    .ca-record-row:first-child { border-top-width: 0; }

    .ca-record-row__identity { min-width: 0; }

    /* Wide: the <dl> wrapper dissolves so every cell is a track of the shared template. */
    .ca-record-row__cells { display: contents; margin: 0; }

    .ca-record-row__actions {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: var(--ca-touch-target);
      min-height: var(--ca-touch-target);
    }

    /* Stacked: identity + actions on line one, the cells wrap below as label/value pairs. */
    @container (max-width: 35.99rem) {
      .ca-record-row {
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-areas:
          'identity actions'
          'cells    cells';
        row-gap: var(--ca-space-1);
        padding-block: var(--ca-space-3);
      }
      .ca-record-row__identity { grid-area: identity; }
      .ca-record-row__actions { grid-area: actions; }
      .ca-record-row__cells {
        grid-area: cells;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
        gap: var(--ca-space-2) var(--ca-space-4);
        min-width: 0;
      }
    }
}
</style>
