<script lang="ts">
  /**
   * KpiGrid: a row of KpiCards (or any equal-weight tiles) that never ends on a partial row.
   *
   * `repeat(auto-fill, minmax(160px, 1fr))` ignores how many children there are, so 3 cards on a
   * 390px phone become 2 + 1 with an empty cell. KpiGrid reads the child count in CSS (`:has()`
   * quantity queries: no JS, SSR-safe) and only uses a column count that divides it evenly:
   * 3 cards are 3 across when they fit and 1 column otherwise, 4 cards are 4, then 2x2, then 1.
   * It reacts to its own width (container query), not the viewport's, so it behaves the same
   * inside a sidebar layout or a narrow card. Tiles are at least 10rem wide.
   *
   * Above 12 children no even split is useful, so it falls back to `auto-fill` and may end on a
   * partial row; use several KpiGrids if that matters.
   *
   *   <KpiGrid>
   *     <KpiCard title="Revenue" value="$112k" />
   *     <KpiCard title="Users" value="24.8k" />
   *     <KpiCard title="Orders" value="1.4k" />
   *   </KpiGrid>
   *
   * Props:
   *   gap — number (px) | CSS gap string (default var(--ca-space-3))
   */
  import type { Snippet } from 'svelte';

  interface Props {
    gap?:      number | string;
    class?:    string;
    children?: Snippet;
  }

  let { gap, class: className = '', children }: Props = $props();

  const style = $derived(
    gap === undefined ? undefined : `--kpi-gap:${typeof gap === 'number' ? `${gap}px` : gap}`
  );
</script>

<div class="ca-kpi-grid {className}" {style}>
  <div class="ca-kpi-grid__grid">
    {@render children?.()}
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /*
     * Column count by child count. For n children the even layouts are the divisors of n, and c
     * columns need c tiles of 10rem plus (c - 1) gaps of up to 1.5rem. Tiers run narrow to wide, so
     * the widest column count that fits and divides n wins by source order. `:global()` keeps the
     * child part of each selector unscoped: the children are other components' roots.
     */
    .ca-kpi-grid {
      container-type: inline-size;
      width: 100%;
      min-width: 0;
      --kpi-gap: var(--ca-space-3);
    }

    .ca-kpi-grid__grid {
      display: grid;
      gap: var(--kpi-gap);
      grid-template-columns: minmax(0, 1fr);
    }

    .ca-kpi-grid__grid > :global(*) { min-width: 0; }

    /* More than 12: no useful even split */
    .ca-kpi-grid__grid:has(> :global(:nth-child(13))) {
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 10rem), 1fr));
    }

    @container (min-width: 21.5rem) {
      .ca-kpi-grid__grid:has(> :global(:nth-child(2):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(4):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(6):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(8):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(10):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(12):last-child)) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @container (min-width: 33rem) {
      .ca-kpi-grid__grid:has(> :global(:nth-child(3):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(6):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(9):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(12):last-child)) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @container (min-width: 44.5rem) {
      .ca-kpi-grid__grid:has(> :global(:nth-child(4):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(8):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(12):last-child)) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    @container (min-width: 56rem) {
      .ca-kpi-grid__grid:has(> :global(:nth-child(5):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(10):last-child)) {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }
    }

    @container (min-width: 67.5rem) {
      .ca-kpi-grid__grid:has(> :global(:nth-child(6):last-child)),
      .ca-kpi-grid__grid:has(> :global(:nth-child(12):last-child)) {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
    }

    @container (min-width: 79rem) {
      .ca-kpi-grid__grid:has(> :global(:nth-child(7):last-child)) {
        grid-template-columns: repeat(7, minmax(0, 1fr));
      }
    }

    @container (min-width: 90.5rem) {
      .ca-kpi-grid__grid:has(> :global(:nth-child(8):last-child)) {
        grid-template-columns: repeat(8, minmax(0, 1fr));
      }
    }
}
</style>
