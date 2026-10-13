<script lang="ts">
  import { PinInput } from 'bits-ui';
  import { uid } from '../../utils/index.js';

  interface Props {
    length?: number;
    value?: string;
    type?: 'numeric' | 'text';
    label?: string;
    description?: string;
    error?: string;
    disabled?: boolean;
    /** Mask entered characters (one-time codes are usually fine unmasked). */
    mask?: boolean;
    class?: string;
    oncomplete?: (value: string) => void;
  }

  let {
    length = 6,
    value = $bindable(''),
    type = 'numeric',
    label,
    description,
    error,
    disabled = false,
    mask = false,
    class: className = '',
    oncomplete,
  }: Props = $props();

  const id = uid('pin');
  const describedBy = $derived(error ? `${id}-err` : description ? `${id}-hint` : undefined);
</script>

<div class="ca-pin {className}" class:ca-pin--error={!!error} class:ca-pin--disabled={disabled}>
  {#if label}
    <label for="{id}-input" class="ca-pin__label">{label}</label>
  {/if}

  <PinInput.Root
    bind:value
    maxlength={length}
    {disabled}
    inputId="{id}-input"
    inputmode={type === 'numeric' ? 'numeric' : 'text'}
    pattern={type === 'numeric' ? '^[0-9]*$' : undefined}
    autocomplete="one-time-code"
    aria-describedby={describedBy}
    aria-invalid={error ? 'true' : undefined}
    onComplete={(v: string) => oncomplete?.(v)}
    class="ca-pin__root"
  >
    {#snippet children({ cells })}
      <div class="ca-pin__cells">
        {#each cells as cell, i (i)}
          <PinInput.Cell {cell} class="ca-pin__cell">
            {#if cell.char !== null && cell.char !== undefined}
              {mask ? '•' : cell.char}
            {:else if cell.hasFakeCaret}
              <span class="ca-pin__caret" aria-hidden="true"></span>
            {/if}
          </PinInput.Cell>
        {/each}
      </div>
    {/snippet}
  </PinInput.Root>

  {#if error}
    <p id="{id}-err" class="ca-pin__hint ca-pin__hint--error" role="alert">{error}</p>
  {:else if description}
    <p id="{id}-hint" class="ca-pin__hint">{description}</p>
  {/if}
</div>

<style>
  .ca-pin {
    display: inline-flex;
    flex-direction: column;
    gap: var(--ca-space-1);
    font-family: var(--ca-font-sans);
  }

  .ca-pin__label {
    font-size: var(--ca-font-size-label);
    font-weight: var(--ca-font-weight-medium);
    color: var(--ca-text-primary);
    line-height: var(--ca-line-height-snug);
  }

  .ca-pin__cells {
    display: flex;
    gap: var(--ca-space-2);
  }

  :global(.ca-pin__cell) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--ca-space-10);
    height: var(--ca-space-12);
    border-radius: var(--ca-radius-control);
    background: var(--ca-field-bg);
    border: var(--ca-border-width) solid var(--ca-field-border-color);
    box-shadow: var(--ca-field-shadow);
    color: var(--ca-text-primary);
    font-size: var(--ca-font-size-h5);
    font-weight: var(--ca-font-weight-semibold);
    font-variant-numeric: tabular-nums;
    transition:
      border-color var(--ca-duration-fast) var(--ca-ease-standard),
      box-shadow var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-pin__cell[data-active]) {
    border-color: var(--ca-brand-main);
    box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-brand-main) 18%, transparent);
  }

  .ca-pin--error :global(.ca-pin__cell) {
    border-color: var(--ca-semantic-error);
  }

  .ca-pin--error :global(.ca-pin__cell[data-active]) {
    box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-semantic-error) 18%, transparent);
  }

  .ca-pin--disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .ca-pin__caret {
    width: var(--ca-border-width);
    height: var(--ca-space-5);
    background: var(--ca-text-primary);
    animation: ca-pin-blink 1s steps(1) infinite;
  }

  @keyframes ca-pin-blink {
    50% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ca-pin__caret {
      animation: none;
    }
  }

  .ca-pin__hint {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }

  .ca-pin__hint--error {
    color: var(--ca-semantic-error);
  }

  @media (pointer: coarse) {
    :global(.ca-pin__cell) {
      height: var(--ca-touch-target);
    }
  }
</style>
