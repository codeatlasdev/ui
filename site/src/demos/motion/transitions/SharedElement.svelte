<script lang="ts">
  import { Button, Card, MotionStage, type MotionCtx } from '@codeatlasdev/ui';
  import { flushSync } from 'svelte';

  const plans = [
    { id: 'atlas', name: 'Atlas Pro', price: 'R$ 129/mo', note: '12 seats, audit log, SSO', hue: 55 },
    { id: 'orbit', name: 'Orbit Team', price: 'R$ 59/mo', note: '5 seats, shared inbox', hue: 245 },
  ];

  // The open plan id, or null for the list. Reduced motion shows the detail (the final state).
  let open = $state<string | null>(null);
  // The stage context, captured from the snippet so the script can react to the stage clock.
  let stage = $state<MotionCtx>();
  let lastCycle = -1;

  type Morph = Document & { startViewTransition?: (cb: () => void) => unknown };

  // View Transitions API: the cover in the list and the cover in the detail share one
  // view-transition-name, so the browser morphs position and size between the two states.
  // Without the API the swap is a plain crossfade (CSS keyframes on the incoming view).
  function go(next: string | null, animate: boolean) {
    const doc = document as Morph;
    if (animate && doc.startViewTransition) doc.startViewTransition(() => flushSync(() => (open = next)));
    else open = next;
  }

  $effect(() => {
    if (!stage) return;
    if (stage.reduced) {
      open = 'atlas';
      return;
    }
    if (!stage.playing || stage.cycle === lastCycle) return;
    lastCycle = stage.cycle;
    go(open === null ? 'atlas' : null, true);
  });
</script>

<MotionStage label="Shared element: a plan cover grows into the detail view" loop={2800}>
  {#snippet children(m)}
    {@const detail = plans.find((p) => p.id === open)}
    <div class="se" {@attach () => { stage = m; }}>
      {#if detail}
        <div class="se__view">
          <Card>
            <div class="se__detail">
              <span class="se__cover se__cover--shared se__cover--big" style="--h:{detail.hue}"></span>
              <div class="se__copy">
                <p class="se__title">{detail.name}</p>
                <p class="se__note">{detail.note}</p>
                <p class="se__price">{detail.price}</p>
                <Button size="sm" variant="outlined" onclick={() => go(null, !m.reduced)}>Back to plans</Button>
              </div>
            </div>
          </Card>
        </div>
      {:else}
        <ul class="se__view se__list">
          {#each plans as p (p.id)}
            <li>
              <button type="button" class="se__tile" aria-label={`Open ${p.name}`} onclick={() => go(p.id, !m.reduced)}>
                <span class="se__cover" class:se__cover--shared={p.id === 'atlas'} style="--h:{p.hue}"></span>
                <span class="se__name">{p.name}</span>
                <span class="se__price">{p.price}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/snippet}
</MotionStage>

<style>
  .se { width: 100%; max-width: 360px; }
  .se__view { animation: se-fade 240ms cubic-bezier(0.2, 0, 0, 1) both; }
  .se__list { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ca-space-3); margin: 0; padding: 0; list-style: none; }
  .se__tile {
    display: grid; gap: var(--ca-space-1); inline-size: 100%; text-align: start; cursor: pointer;
    min-block-size: var(--ca-touch-target); padding: var(--ca-space-2); font: inherit; color: var(--ca-text-primary);
    background: var(--ca-surface-raised); border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-lg);
  }
  .se__tile:focus-visible { outline: var(--ca-border-width-focus) solid var(--ca-focus-ring); outline-offset: var(--ca-border-width-focus); }
  .se__cover {
    display: block; aspect-ratio: 4 / 3; border-radius: var(--ca-radius-md);
    background: linear-gradient(135deg, oklch(0.72 0.15 var(--h)), oklch(0.5 0.14 calc(var(--h) + 30)));
  }
  .se__cover--shared { view-transition-name: se-cover; }
  .se__cover--big { inline-size: 7.5rem; flex: none; aspect-ratio: 1; }
  .se__name { font-weight: var(--ca-font-weight-semibold); }
  .se__price { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
  .se__detail { display: flex; gap: var(--ca-space-4); align-items: flex-start; }
  .se__copy { display: grid; gap: var(--ca-space-1); justify-items: start; }
  .se__title { margin: 0; font-weight: var(--ca-font-weight-semibold); font-size: var(--ca-font-size-h6); }
  .se__note { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
  @keyframes se-fade { from { opacity: 0; } to { opacity: 1; } }

  :global(::view-transition-group(se-cover)) {
    animation-duration: 420ms;
    animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  @media (prefers-reduced-motion: reduce) { .se__view { animation: none; } }
</style>
