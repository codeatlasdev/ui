<script lang="ts">
  import { Star } from '@lucide/svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { rating } from '../../i18n/groups/rating.js';

  interface Props {
    /** Bindable value, 0 = none. */
    value?: number;
    /** Number of stars. @default 5 */
    max?: number;
    /** 1 for whole stars, 0.5 for half steps. @default 1 */
    step?: 1 | 0.5;
    /** Visible label and the group's accessible name. */
    label: string;
    /** Keeps `label` for assistive tech only. */
    hideLabel?: boolean;
    /** Native `name`: the value is part of FormData on a plain submit. */
    name?: string;
    /** Shows the value only: one image with a text alternative, no inputs. */
    readonly?: boolean;
    disabled?: boolean;
    /** Star size: `md` 24px, `sm` 18px. @default 'md' */
    size?: 'sm' | 'md';
    class?: string;
    onchange?: (value: number) => void;
  }

  let {
    value = $bindable(0),
    max = 5,
    step = 1,
    label,
    hideLabel = false,
    name,
    readonly = false,
    disabled = false,
    size = 'md',
    class: className = '',
    onchange,
  }: Props = $props();

  const t = useMessages(rating);
  const uid = $props.id();
  const options = $derived(Array.from({ length: Math.round(max / step) }, (_, i) => +((i + 1) * step).toFixed(1)));
  // Fill of star n (1-based): 1 full, 0.5 half, 0 empty.
  const fill = (n: number) => Math.max(0, Math.min(1, value - (n - 1)));

  // Native radios move on the arrows; Home and End jump to the lowest and highest step.
  function ends(group: HTMLElement) {
    const onkeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Home' && e.key !== 'End') return;
      const radios = Array.from(group.querySelectorAll<HTMLInputElement>('input:not(:disabled)'));
      const target = e.key === 'Home' ? radios[0] : radios[radios.length - 1];
      if (!target) return;
      e.preventDefault();
      target.focus();
      target.click();
    };
    group.addEventListener('keydown', onkeydown);
    return () => group.removeEventListener('keydown', onkeydown);
  }

  function set(v: number) {
    if (disabled || v === value) return;
    value = v;
    onchange?.(v);
  }
</script>

{#if readonly}
  <span
    class="ca-rating ca-rating--{size} ca-rating--readonly {className}"
    role="img"
    aria-label={t().rating.summary(label, value, max)}
  >
    {#each Array.from({ length: max }) as _, i (i)}
      <span class="ca-rating__star" style="--ca-rating-fill:{fill(i + 1) * 100}%" aria-hidden="true">
        <Star class="ca-rating__glyph" />
        <Star class="ca-rating__glyph ca-rating__glyph--fill" />
      </span>
    {/each}
  </span>
{:else}
  <div class="ca-rating ca-rating--{size} {className}" data-disabled={disabled ? '' : undefined}>
    <span id="{uid}-label" class="ca-rating__label" class:ca-sr-only={hideLabel}>{label}</span>
    <div class="ca-rating__stars" role="radiogroup" aria-labelledby="{uid}-label" aria-disabled={disabled ? 'true' : undefined} {@attach ends}>
      {#each options as v (v)}
        {@const half = v % 1 !== 0}
        <label class="ca-rating__option" class:ca-rating__option--half={half} data-on={value >= v ? '' : undefined}>
          <input
            type="radio"
            class="ca-rating__input"
            name={name ?? uid}
            value={v}
            checked={value === v}
            {disabled}
            aria-label={t().rating.option(v)}
            onchange={() => set(v)}
          />
          {#if !half || step === 0.5}
            <Star class="ca-rating__glyph" aria-hidden="true" />
          {/if}
        </label>
      {/each}
    </div>
  </div>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-rating { display: inline-flex; align-items: center; gap: var(--ca-space-2); }
    .ca-rating--md { --x-star: var(--ca-rating-size, var(--ca-space-6)); }
    .ca-rating--sm { --x-star: var(--ca-rating-size, calc(var(--ca-space-4) + var(--ca-space-0-5))); }
    /* A whole star is the touch target on a coarse pointer (a half step is half of it). */
    @media (pointer: coarse) { .ca-rating__stars { --x-star: var(--ca-touch-target); } }
    .ca-rating__label { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
    .ca-rating__stars { display: inline-flex; }
    .ca-rating__option {
      position: relative;
      display: inline-flex;
      inline-size: var(--x-star);
      block-size: var(--x-star);
      color: var(--ca-rating-empty, var(--ca-outline-default));
    }
    /* Half steps: two half-width options per star, the second draws the star clipped to its right half. */
    .ca-rating__stars:has(.ca-rating__option--half) .ca-rating__option { inline-size: calc(var(--x-star) / 2); overflow: hidden; }
    .ca-rating__stars:has(.ca-rating__option--half) .ca-rating__option:not(.ca-rating__option--half) :global(.ca-rating__glyph) { transform: translateX(-50%); }
    /* The native radio covers the whole star: it is the click target, the focus and what assistive tech reads. */
    .ca-rating__input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: inherit; }
    .ca-rating__option[data-on] { color: var(--ca-rating-color, var(--ca-semantic-warning)); }
    .ca-rating__option[data-on] :global(.ca-rating__glyph) { fill: currentColor; }
    :global(.ca-rating__glyph) { inline-size: var(--x-star); block-size: var(--x-star); flex: none; }
    .ca-rating__option:has(input:focus-visible) { outline: var(--ca-border-width-focus) solid var(--ca-focus-ring); outline-offset: 1px; border-radius: var(--ca-radius-xs); }
    .ca-rating[data-disabled] .ca-rating__option { color: var(--ca-text-disabled); }
    .ca-rating__star { position: relative; display: inline-flex; color: var(--ca-rating-empty, var(--ca-outline-default)); inline-size: var(--x-star); block-size: var(--x-star); }
    .ca-rating--readonly .ca-rating__star :global(.ca-rating__glyph--fill) {
      position: absolute;
      inset: 0;
      fill: var(--ca-rating-color, var(--ca-semantic-warning));
      color: var(--ca-rating-color, var(--ca-semantic-warning));
      clip-path: inset(0 calc(100% - var(--ca-rating-fill)) 0 0);
    }
    @media (forced-colors: active) {
      .ca-rating__option[data-on], .ca-rating--readonly .ca-rating__star :global(.ca-rating__glyph--fill) { color: CanvasText; fill: CanvasText; }
    }
}
</style>
