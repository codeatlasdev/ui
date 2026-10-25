<script lang="ts">
  import TextField from '../TextField/TextField.svelte';
  import { uid } from '../../utils/index.js';
  import { contrast, formatOklch, parseColorInput, wcagLevel } from '../../utils/color.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { colorField } from '../../i18n/groups/colorField.js';
  const t = useMessages(colorField);

  /**
   * ColorField: a color input for theme and brand work.
   *
   *   <ColorField label="Brand" bind:value={brand} against="#ffffff" />
   *
   * A swatch opens the native color picker, the text field accepts `#rgb`, `#rrggbb`, `rgb()`,
   * `oklch()` and `color-mix()`. `value` is whatever the user committed, as typed, so an `oklch()`
   * stays `oklch()`; `format` only decides what the swatch picker writes back. With `against` the
   * field shows the WCAG contrast of the color on that background, with the level it reaches
   * (pass `foreground` to measure the color as text on it, or leave it to measure it as the fill).
   */
  interface Props {
    label: string;
    /** Committed color as a CSS string. Invalid input never reaches it. */
    value?: string;
    /** What the native picker writes: `hex` (default) or `oklch`. */
    format?: 'hex' | 'oklch';
    /** Background to measure contrast against (any CSS color). Omit to hide the readout. */
    against?: string;
    /** Role of `value` in the contrast pair: `text` (value on `against`) or `fill` (against on value). @default "text" */
    role?: 'text' | 'fill';
    /** Minimum ratio that counts as passing. 4.5 for text, 3 for UI parts. @default 4.5 */
    minRatio?: number;
    description?: string;
    disabled?: boolean;
    class?: string;
    onchange?: (value: string) => void;
  }

  let {
    label,
    value = $bindable('#000000'),
    format = 'hex',
    against,
    role = 'text',
    minRatio = 4.5,
    description,
    disabled = false,
    class: className = '',
    onchange,
  }: Props = $props();

  const id = uid('cf');
  let text = $state('');
  let editing = $state(false);
  let error = $state('');

  $effect(() => {
    if (!editing) text = value;
  });

  const parsed = $derived(parseColorInput(value));
  /** Always a `#rrggbb` for the native picker, which only speaks hex. */
  const pickerHex = $derived(parsed?.hex ?? '#000000');

  const ratio = $derived(
    against ? (role === 'text' ? contrast(value, against) : contrast(against, value)) : null
  );
  const level = $derived(ratio === null ? null : wcagLevel(ratio));
  const passes = $derived(ratio !== null && ratio >= minRatio);

  function commit(next: string) {
    const p = parseColorInput(next);
    if (!p) {
      error = t().colorField.invalid;
      return;
    }
    error = '';
    editing = false;
    // Keep the user's own notation (`oklch()` stays `oklch()`); a bare `rrggbb` gets its `#`.
    const out = /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(next.trim()) ? p.hex : next.trim();
    text = out;
    if (out === value) return;
    value = out;
    onchange?.(out);
  }

  function pick(e: Event) {
    const hex = (e.target as HTMLInputElement).value;
    const p = parseColorInput(hex);
    commit(format === 'oklch' && p ? formatOklch(p.oklch) : hex);
  }
</script>

<div class="ca-color-field {className}" data-disabled={disabled ? '' : undefined}>
  <TextField
    size="sm"
    {label}
    {disabled}
    {description}
    {error}
    spellcheck={false}
    autocomplete="off"
    bind:value={text}
    oninput={() => {
      editing = true;
      error = '';
    }}
    onchange={commit}
    onblur={() => {
      if (editing && parseColorInput(text)) commit(text);
      else if (editing && text.trim() === '') {
        editing = false;
        text = value;
      }
    }}
  >
    {#snippet leading()}
      <span class="ca-color-field__swatch" style="--ca-color-field-fill:{parsed?.css ?? value}"></span>
    {/snippet}
    {#snippet trailing()}
      <label class="ca-color-field__pick" for="{id}-native">
        <span class="ca-sr-only">{t().colorField.pick(label)}</span>
        <input
          id="{id}-native"
          type="color"
          class="ca-color-field__native"
          {disabled}
          value={pickerHex}
          oninput={pick}
        />
      </label>
    {/snippet}
  </TextField>
  {#if ratio !== null && level}
    <p class="ca-color-field__contrast" data-pass={passes ? '' : undefined} data-level={level}>
      <span class="ca-color-field__ratio">{ratio.toFixed(1)}:1</span>
      <span class="ca-color-field__level">{passes ? t().colorField.pass(level) : t().colorField.fail(minRatio)}</span>
    </p>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-color-field) {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1);
      min-width: 0;
    }

    /* The swatch sits in the field's leading slot. Its ring uses the control outline so a color
       close to the field background stays visible. */
    :global(.ca-color-field__swatch) {
      display: block;
      inline-size: var(--ca-space-4);
      block-size: var(--ca-space-4);
      border-radius: var(--ca-radius-round);
      background: var(--ca-color-field-fill);
      box-shadow: 0 0 0 var(--ca-border-width) var(--ca-outline-control);
    }

    :global(.ca-color-field__pick) {
      position: relative;
      display: inline-grid;
      place-items: center;
      inline-size: var(--ca-space-6);
      block-size: var(--ca-space-6);
      border-radius: var(--ca-radius-sm);
      cursor: pointer;
      background: conic-gradient(
        oklch(0.72 0.17 25),
        oklch(0.8 0.15 90),
        oklch(0.75 0.17 150),
        oklch(0.72 0.12 220),
        oklch(0.65 0.2 290),
        oklch(0.7 0.2 350),
        oklch(0.72 0.17 25)
      );
      box-shadow: 0 0 0 var(--ca-border-width) var(--ca-outline-control);
    }

    /* The native input fills the rainbow chip and is invisible but real: it keeps its own focus
       ring, keyboard behavior and the OS picker. */
    :global(.ca-color-field__native) {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      margin: 0;
      padding: 0;
      border: 0;
      opacity: 0;
      cursor: pointer;
    }
    :global(.ca-color-field__pick:has(.ca-color-field__native:focus-visible)) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-space-0-5);
    }
    :global(.ca-color-field[data-disabled] .ca-color-field__pick) {
      cursor: not-allowed;
      filter: grayscale(1);
    }

    :global(.ca-color-field__contrast) {
      display: flex;
      align-items: baseline;
      gap: var(--ca-space-2);
      margin: 0;
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
    }
    :global(.ca-color-field__ratio) {
      font-family: var(--ca-font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--ca-text-primary);
    }
    /* The state is spelled out in words, never color alone (WCAG 1.4.1). */
    :global(.ca-color-field__contrast:not([data-pass]) .ca-color-field__level) {
      color: var(--ca-semantic-error);
      font-weight: var(--ca-font-weight-semibold);
    }
}
</style>
