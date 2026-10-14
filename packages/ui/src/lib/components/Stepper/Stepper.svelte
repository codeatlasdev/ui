<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import { Check } from '@lucide/svelte';
  const t = useT();

  export interface StepItem {
    label: string;
    description?: string;
  }

  interface Props {
    steps: StepItem[];
    current?: number; // 0-indexed, bindable
    class?: string;
  }

  let { steps, current = $bindable(0), class: className = '' }: Props = $props();
</script>

<nav aria-label={t().stepper.label} class="ca-stepper {className}">
  {#each steps as step, i}
    {@const done = i < current}
    {@const active = i === current}
    <div class="ca-stepper__step" class:ca-stepper__step--done={done} class:ca-stepper__step--active={active}>
      <button
        type="button"
        class="ca-stepper__bubble"
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
        {#if step.description}
          <span class="ca-stepper__desc">{step.description}</span>
        {/if}
      </div>
    </div>
    {#if i < steps.length - 1}
      <div class="ca-stepper__line" class:ca-stepper__line--done={done} aria-hidden="true"></div>
    {/if}
  {/each}
</nav>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-stepper {
      display: flex;
      align-items: flex-start;
      gap: 0;
      width: 100%;
    }

    .ca-stepper__step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ca-space-2);
      flex-shrink: 0;
    }

    .ca-stepper__bubble {
      width: var(--ca-space-8);
      height: var(--ca-space-8);
      border-radius: 50%;
      border: var(--ca-border-width-strong) solid var(--ca-outline-default);
      background: var(--ca-glass-bg);
      -webkit-backdrop-filter: var(--ca-blur-ultra-thin);
      backdrop-filter: var(--ca-blur-ultra-thin);
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
      max-width: var(--ca-space-20);
    }

    .ca-stepper__label {
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-secondary);
      white-space: nowrap;
    }

    .ca-stepper__step--active .ca-stepper__label,
    .ca-stepper__step--done .ca-stepper__label {
      color: var(--ca-text-primary);
    }

    .ca-stepper__desc {
      font-size: var(--ca-font-size-micro);
      color: var(--ca-text-hint);
    }

    .ca-stepper__line {
      flex: 1;
      height: var(--ca-border-width-strong);
      background: var(--ca-outline-subtle);
      margin-top: calc(var(--ca-space-4) - var(--ca-border-width-strong) / 2); /* align with bubble center */
      transition: background var(--ca-duration-base) var(--ca-ease-standard);
    }

    .ca-stepper__line--done {
      background: var(--ca-brand-main);
    }
}
</style>
