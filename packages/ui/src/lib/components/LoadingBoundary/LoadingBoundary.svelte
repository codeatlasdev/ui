<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useT } from '../../i18n/state.svelte.js';
  import Skeleton from '../Skeleton/Skeleton.svelte';
  const t = useT();

  /**
   * LoadingBoundary: `<svelte:boundary>` with a loading UI that never flashes.
   *
   * Content that suspends (`await` in a component, `$derived(await …)`) shows `pending`
   * only when the wait is longer than `delay`, and once shown keeps it for at least
   * `minDuration`, so a fast response never flickers a skeleton for one frame
   * (NN/g: nothing under 1 s, a skeleton under 10 s). While waiting the region is
   * `aria-busy` and named for screen readers. Needs Svelte's `experimental.async`.
   *
   * Usage:
   *   <LoadingBoundary label="Loading invoices">
   *     <Invoices />   <!-- contains `await load()` -->
   *   </LoadingBoundary>
   */
  interface Props {
    /** The suspending content. */
    children: Snippet;
    /** What to show while waiting. Defaults to `rows` skeleton lines. */
    pending?: Snippet;
    /** Wait this long (ms) before showing `pending`; faster loads show nothing. */
    delay?: number;
    /** Once `pending` is visible, keep it at least this long (ms). */
    minDuration?: number;
    /** Accessible name of the busy region. Defaults to a localised "Loading…". */
    label?: string;
    /** Skeleton lines of the default `pending`. */
    rows?: number;
    class?: string;
  }

  let {
    children,
    pending: placeholder,
    delay = 200,
    minDuration = 500,
    label,
    rows = 3,
    class: className = '',
  }: Props = $props();

  // `hold` is the minimum-duration gate: while true the resolved content stays hidden
  // behind the placeholder, so the swap happens once, after `minDuration`.
  let waiting = $state(false);
  let shown = $state(false);
  let hold = $state(false);

  /** Mounted by the boundary only while it is pending: drives `shown` / `hold`. */
  function gate(_node: HTMLElement) {
    waiting = true;
    let shownAt = 0;
    const show = () => {
      shown = true;
      shownAt = performance.now();
    };
    const timer = delay > 0 ? setTimeout(show, delay) : (show(), undefined);
    return () => {
      // The boundary resolved: this teardown runs from the pending effect.
      clearTimeout(timer);
      waiting = false;
      if (!shown) return;
      const left = minDuration - (performance.now() - shownAt);
      if (left <= 0) {
        shown = false;
        return;
      }
      hold = true;
      setTimeout(() => {
        hold = false;
        shown = false;
      }, left);
    };
  }
</script>

<div
  class="ca-loading-boundary {className}"
  aria-busy={waiting || hold ? 'true' : undefined}
  aria-label={waiting || hold ? (label ?? t().spinner.label) : undefined}
  role={waiting || hold ? 'group' : undefined}
  data-state={waiting ? 'pending' : hold ? 'holding' : 'ready'}
>
  {#if (waiting || hold) && shown}
    <div class="ca-loading-boundary__pending">
      {#if placeholder}
        {@render placeholder()}
      {:else}
        <Skeleton variant="text" {rows} />
      {/if}
    </div>
  {/if}
  <div class="ca-loading-boundary__content" hidden={hold}>
    <svelte:boundary>
      {@render children()}
      {#snippet pending()}
        <span class="ca-loading-boundary__gate" hidden {@attach gate}></span>
      {/snippet}
    </svelte:boundary>
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-loading-boundary { display: block; }
    .ca-loading-boundary__content[hidden] { display: none; }
}
</style>
