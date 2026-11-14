<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { stepper } from '../../i18n/groups/stepper.js';
  import { Check } from '@lucide/svelte';
  const t = useMessages(stepper);

  export interface StepItem {
    label: string;
    description?: string;
  }

  interface Props {
    steps: StepItem[];
    current?: number; // 0-indexed, bindable
    /**
     * `horizontal`: steps in a row, text under each number. `vertical`: a list, number then text.
     * `auto` (default): vertical when the stepper is narrower than 40rem (container query), horizontal above.
     * `compact`: one line, "Step 2 of 6" and the current label, over a thin progress bar (`role="progressbar"`):
     * for many steps on a phone, where the vertical list would push the form down (#1050).
     */
    orientation?: 'horizontal' | 'vertical' | 'auto' | 'compact';
    /** `false` keeps only the labels (the descriptions take a line each under them). @default true */
    showDescriptions?: boolean;
    class?: string;
  }

  let { steps, current = $bindable(0), orientation = 'auto', showDescriptions = true, class: className = '' }: Props = $props();

  const count = $derived(t().stepper.progress(Math.min(current + 1, steps.length), steps.length));
</script>

{#if orientation === 'compact'}
  {@const step = steps[current]}
  <nav aria-label={t().stepper.label} class="ca-stepper ca-stepper--compact {className}">
    <p class="ca-stepper__summary">
      <span class="ca-stepper__count">{count}</span>
      {#if step}<span class="ca-stepper__label">{step.label}</span>{/if}
    </p>
    <div
      class="ca-stepper__bar"
      role="progressbar"
      aria-label={step ? `${count}: ${step.label}` : count}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={Math.min(current + 1, steps.length)}
      style="--ca-stepper-progress:{steps.length ? Math.min(current + 1, steps.length) / steps.length : 0}"
    ><span class="ca-stepper__bar-fill"></span></div>
  </nav>
{:else}
<nav aria-label={t().stepper.label} class="ca-stepper {className}">
  <ol class="ca-stepper__list" data-orientation={orientation}>
  {#each steps as step, i}
    {@const done = i < current}
    {@const active = i === current}
    <li class="ca-stepper__step" class:ca-stepper__step--done={done} class:ca-stepper__step--active={active}>
      <button
        type="button"
        class="ca-stepper__bubble"
        data-ca-blur="ultra-thin"
        aria-current={active ? 'step' : undefined}
        aria-label={t().stepper.step(i + 1, step.label, done)}
        onclick={() => { current = i; }}
      >
        {#if done}
          <Check size={14} stroke-width={2.5} />
        {:else}
          <span>{i + 1}</span>
        {/if}
      </button>
      <div class="ca-stepper__text">
        <span class="ca-stepper__label">{step.label}</span>
        {#if step.description && showDescriptions}
          <span class="ca-stepper__desc">{step.description}</span>
        {/if}
      </div>
    </li>
    {#if i < steps.length - 1}
      <li class="ca-stepper__line" class:ca-stepper__line--done={done} aria-hidden="true"></li>
    {/if}
  {/each}
  </ol>
</nav>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* Compact (#1050): a summary line and a 4px progress bar, ~40px in all. */
    .ca-stepper__summary {
      display: flex;
      align-items: baseline;
      gap: var(--ca-space-2);
      min-width: 0;
      margin: 0;
      font-size: var(--ca-font-size-body2);
    }
    .ca-stepper__count { flex: none; color: var(--ca-text-secondary); }
    .ca-stepper--compact .ca-stepper__label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ca-stepper__bar {
      height: var(--ca-space-1);
      margin-top: var(--ca-space-2);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-surface-sunken);
      overflow: hidden;
    }
    .ca-stepper__bar-fill {
      display: block;
      height: 100%;
      width: calc(var(--ca-stepper-progress, 0) * 100%);
      border-radius: inherit;
      background: var(--ca-brand-main);
      transition: width var(--ca-duration-base) var(--ca-ease-standard);
    }
    @media (forced-colors: active) {
      .ca-stepper__bar { border: 1px solid CanvasText; }
      .ca-stepper__bar-fill { background: Highlight; }
    }

    /* The nav is the container; the list inside reads its width (#988). */
    .ca-stepper {
      container: ca-stepper / inline-size;
      width: 100%;
    }

    .ca-stepper__list {
      display: flex;
      align-items: flex-start;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    /* Horizontal: equal columns, so the text gets the room (#988). The connector is drawn from this
       number to the next one across the column gap, not a flex item that eats the row. */
    .ca-stepper__step {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ca-space-2);
      flex: 1 1 0;
      min-width: 0;
    }
    .ca-stepper__step:not(:last-child)::after {
      content: '';
      position: absolute;
      top: calc(var(--ca-space-4) - var(--ca-border-width-strong) / 2);
      left: calc(50% + var(--ca-space-4) + var(--ca-space-2));
      right: calc(-50% + var(--ca-space-4) + var(--ca-space-2));
      height: var(--ca-border-width-strong);
      background: var(--ca-outline-subtle);
      transition: background var(--ca-duration-base) var(--ca-ease-standard);
    }
    .ca-stepper__step--done:not(:last-child)::after { background: var(--ca-brand-main); }

    .ca-stepper__bubble {
      width: var(--ca-space-8);
      height: var(--ca-space-8);
      border-radius: 50%;
      border: var(--ca-border-width-strong) solid var(--ca-outline-default);
      background: var(--ca-glass-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-hint);
      cursor: pointer;
      transition:
        border-color var(--ca-duration-fast) var(--ca-ease-standard),
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-stepper__step--active .ca-stepper__bubble {
      border-color: var(--ca-brand-main);
      background: color-mix(in oklab, var(--ca-brand-main) 12%, transparent);
      color: var(--ca-brand-text);
    }

    .ca-stepper__step--done .ca-stepper__bubble {
      border-color: var(--ca-brand-fill);
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
    }

    .ca-stepper__text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ca-space-0-5);
      text-align: center;
      max-width: var(--ca-stepper-text-max, 40ch);
      min-width: 0;
    }

    .ca-stepper__label {
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-secondary);
      overflow-wrap: anywhere;
    }

    .ca-stepper__step--active .ca-stepper__label,
    .ca-stepper__step--done .ca-stepper__label {
      color: var(--ca-text-primary);
    }

    .ca-stepper__desc {
      font-size: var(--ca-font-size-micro);
      color: var(--ca-text-hint);
    }

    /* The rail item only shows in the vertical list. */
    .ca-stepper__line {
      display: none;
      height: var(--ca-border-width-strong);
      background: var(--ca-outline-subtle);
      margin-top: calc(var(--ca-space-4) - var(--ca-border-width-strong) / 2); /* align with bubble center */
      transition: background var(--ca-duration-base) var(--ca-ease-standard);
    }

    .ca-stepper__line--done {
      background: var(--ca-brand-main);
    }

    /* Vertical (explicit, or auto in a narrow container): number then text, a short rail between steps. */
    .ca-stepper__list[data-orientation='vertical'] {
      flex-direction: column;
      align-items: stretch;

      & .ca-stepper__step {
        position: static;
        flex: none;
        flex-direction: row;
        align-items: flex-start;
        gap: var(--ca-space-3);
      }
      & .ca-stepper__bubble { flex: none; }
      & .ca-stepper__step::after { content: none; }
      & .ca-stepper__text {
        align-items: flex-start;
        text-align: start;
        max-width: none;
        padding-top: var(--ca-space-1-5);
      }
      & .ca-stepper__line {
        display: block;
        flex: none;
        width: var(--ca-border-width-strong);
        height: var(--ca-space-3);
        margin: var(--ca-space-1) 0;
        margin-inline-start: calc(var(--ca-space-4) - var(--ca-border-width-strong) / 2);
      }
    }
    @container ca-stepper (max-width: 40rem) {
      .ca-stepper__list[data-orientation='auto'] {
        flex-direction: column;
        align-items: stretch;

        & .ca-stepper__step {
          position: static;
          flex: none;
          flex-direction: row;
          align-items: flex-start;
          gap: var(--ca-space-3);
        }
        & .ca-stepper__bubble { flex: none; }
        & .ca-stepper__step::after { content: none; }
        & .ca-stepper__text {
          align-items: flex-start;
          text-align: start;
          max-width: none;
          padding-top: var(--ca-space-1-5);
        }
        & .ca-stepper__line {
          display: block;
          flex: none;
          width: var(--ca-border-width-strong);
          height: var(--ca-space-3);
          margin: var(--ca-space-1) 0;
          margin-inline-start: calc(var(--ca-space-4) - var(--ca-border-width-strong) / 2);
        }
      }
    }
}
</style>
