<script lang="ts" module>
  import type { Side } from '../../primitives/index.js';

  export interface TourStep {
    /** The element the step points at: a CSS selector or a function returning it. */
    target: string | (() => HTMLElement | null);
    title: string;
    body: string;
    side?: Side;
  }
</script>

<script lang="ts">
  import { X } from '@lucide/svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { tour } from '../../i18n/groups/tour.js';
  import { layers } from '../../stores/layers.svelte.js';
  import { announce } from '../../utils/announce.js';
  import Button from '../Button/Button.svelte';
  import IconButton from '../Button/IconButton.svelte';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';

  interface Props {
    steps: TourStep[];
    /** Bindable: the tour is showing. */
    open?: boolean;
    /** Bindable: index of the current step. */
    step?: number;
    /** Called when the last step is done or the tour is skipped / dismissed. */
    onclose?: (reason: 'done' | 'skip') => void;
  }

  let { steps, open = $bindable(false), step = $bindable(0), onclose }: Props = $props();

  const t = useMessages(tour);
  const uid = $props.id();
  const current = $derived(steps[step]);
  const resolve = (s: TourStep | undefined) =>
    !s ? null : typeof s.target === 'string' ? document.querySelector<HTMLElement>(s.target) : s.target();

  let anchor = $state<HTMLElement | null>(null);
  $effect(() => {
    if (!open) return;
    const el = resolve(current);
    anchor = el;
    if (!el) return;
    el.setAttribute('data-ca-tour-target', '');
    el.scrollIntoView({ block: 'center', behavior: 'auto' });
    announce(`${current?.title}. ${t().tour.progress(step + 1, steps.length)}`);
    return () => el.removeAttribute('data-ca-tour-target');
  });
  // A modal opened over the page hides the tour (rule 10b); it comes back when the modal closes.
  const shown = $derived(open && !!anchor && !layers.blocks(anchor));

  function close(reason: 'done' | 'skip') {
    open = false;
    onclose?.(reason);
  }
  function next() {
    if (step < steps.length - 1) step += 1;
    else close('done');
  }
  function back() {
    if (step > 0) step -= 1;
  }
</script>

<FloatingLayer
  {anchor}
  open={shown}
  side={current?.side ?? 'bottom'}
  sideOffset={10}
  role="dialog"
  aria-labelledby="{uid}-title"
  class="ca-tour"
  blur="overlay"
  restoreFocus={false}
  onDismiss={(reason) => { if (reason === 'escape') close('skip'); }}
  onMounted={(el) => el.querySelector<HTMLElement>('.ca-tour__primary')?.focus()}
>
  {#if current}
    <div class="ca-tour__head">
      <h2 id="{uid}-title" class="ca-tour__title">{current.title}</h2>
      <IconButton variant="ghost" size="sm" aria-label={t().tour.skip} onclick={() => close('skip')}><X size={16} /></IconButton>
    </div>
    <p class="ca-tour__body">{current.body}</p>
    <div class="ca-tour__foot">
      <span class="ca-tour__progress">{t().tour.progress(step + 1, steps.length)}</span>
      <div class="ca-tour__actions">
        {#if step > 0}<Button variant="ghost" size="sm" onclick={back}>{t().tour.back}</Button>{/if}
        <Button variant="filled" size="sm" class="ca-tour__primary" onclick={next}>
          {step < steps.length - 1 ? t().tour.next : t().tour.done}
        </Button>
      </div>
    </div>
  {/if}
</FloatingLayer>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-tour) {
      inline-size: min(var(--ca-tour-width, 20rem), calc(100vw - 2 * var(--ca-space-4)));
      padding: var(--ca-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-2);
    }
    .ca-tour__head { display: flex; align-items: start; justify-content: space-between; gap: var(--ca-space-2); }
    .ca-tour__title { margin: 0; font-size: var(--ca-font-size-body1); font-weight: var(--ca-font-weight-semibold); color: var(--ca-text-primary); }
    .ca-tour__body { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); line-height: var(--ca-line-height-body); }
    .ca-tour__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--ca-space-2); margin-top: var(--ca-space-1); }
    .ca-tour__progress { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
    .ca-tour__actions { display: flex; gap: var(--ca-space-2); }
    /* The step's target is ringed, so the reader sees what the step is about. */
    :global([data-ca-tour-target]) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-space-1);
      border-radius: var(--ca-radius-sm);
    }
}
</style>
