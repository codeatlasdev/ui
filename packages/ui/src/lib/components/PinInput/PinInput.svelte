<script lang="ts">
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

  const id = $props.id();
  const describedBy = $derived(error ? `${id}-err` : description ? `${id}-hint` : undefined);

  // One real <input> covers the cells: it owns focus, selection, IME/autofill (one-time-code),
  // paste and the keyboard; the cells only paint what it holds. `sel` mirrors its selection so
  // the cell under the caret (or the selected range) can be highlighted.
  let input = $state<HTMLInputElement>();
  let focused = $state(false);
  let selStart = $state(0);
  let selEnd = $state(0);

  const pattern = $derived(type === 'numeric' ? /^[0-9]*$/ : null);

  function syncSelection() {
    if (!input) return;
    selStart = input.selectionStart ?? input.value.length;
    selEnd = input.selectionEnd ?? input.value.length;
  }

  /** The caret sits at the end of what's typed; keep one cell selectable when full. */
  function placeCaret() {
    if (!input) return;
    const at = Math.min(input.value.length, length - 1);
    input.setSelectionRange(at, input.value.length);
    syncSelection();
  }

  function update(next: string) {
    const was = value;
    value = next;
    if (next.length === length && was !== next) oncomplete?.(next);
  }

  function oninput(e: Event & { currentTarget: HTMLInputElement }) {
    const el = e.currentTarget;
    const next = el.value.slice(0, length);
    if (pattern && !pattern.test(next)) {
      // Reject the whole edit: restore the previous value and caret.
      el.value = value;
      syncSelection();
      return;
    }
    if (el.value !== next) el.value = next;
    update(next);
    syncSelection();
  }

  function onpaste(e: ClipboardEvent & { currentTarget: HTMLInputElement }) {
    const el = e.currentTarget;
    const text = e.clipboardData?.getData('text/plain') ?? '';
    e.preventDefault();
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    const next = (value.slice(0, start) + text + value.slice(end)).slice(0, length);
    if (next.length > 0 && pattern && !pattern.test(next)) return;
    el.value = next;
    update(next);
    placeCaret();
  }

  function onfocus() {
    focused = true;
    // Defer: the browser places the caret after focus handlers run.
    requestAnimationFrame(placeCaret);
  }

  const cells = $derived(
    Array.from({ length }, (_, i) => {
      const char = value[i] ?? null;
      const active =
        focused && (selStart === selEnd ? i === selStart : i >= selStart && i < selEnd);
      return { char, active, caret: active && char === null };
    })
  );
</script>

<div class="ca-pin {className}" class:ca-pin--error={!!error} class:ca-pin--disabled={disabled}>
  {#if label}
    <label for="{id}-input" class="ca-pin__label">{label}</label>
  {/if}

  <div class="ca-pin__root">
    <div class="ca-pin__cells">
      {#each cells as cell, i (i)}
        <div class="ca-pin__cell" data-active={cell.active ? '' : undefined} data-inactive={cell.active ? undefined : ''}>
          {#if cell.char !== null}
            {mask ? '•' : cell.char}
          {:else if cell.caret}
            <span class="ca-pin__caret" aria-hidden="true"></span>
          {/if}
        </div>
      {/each}
    </div>
    <input
      bind:this={input}
      id="{id}-input"
      class="ca-pin__input"
      {value}
      maxlength={length}
      {disabled}
      inputmode={type === 'numeric' ? 'numeric' : 'text'}
      pattern={type === 'numeric' ? '^[0-9]*$' : undefined}
      autocomplete="one-time-code"
      aria-describedby={describedBy}
      aria-invalid={error ? 'true' : undefined}
      {oninput}
      {onpaste}
      {onfocus}
      onblur={() => (focused = false)}
      onselect={syncSelection}
      onkeyup={syncSelection}
      onclick={syncSelection}
    />
  </div>

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

  .ca-pin__root {
    position: relative;
    cursor: text;
    user-select: none;
  }

  .ca-pin--disabled .ca-pin__root {
    cursor: default;
  }

  .ca-pin__cells {
    display: flex;
    gap: var(--ca-space-2);
  }

  /* Transparent input stacked over the cells: it receives every pointer/keyboard/paste event
     and the cells underneath only paint. */
  .ca-pin__input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    box-shadow: none;
    color: transparent;
    caret-color: transparent;
    opacity: 1;
    font: inherit;
    /* Glyphs are transparent; 16px+ keeps iOS from zooming the page on focus. */
    letter-spacing: -0.5em;
    font-size: max(16px, 1em);
  }

  .ca-pin__input::selection {
    background: transparent;
    color: transparent;
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
