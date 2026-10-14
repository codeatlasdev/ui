<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import TextField from '../components/TextField/TextField.svelte';
  import { mask as maskAction } from './mask.js';

  interface Props {
    label?:        string;
    placeholder?:  string;
    /** Masked value (what the user sees). */
    value?:        string;
    /** Pure formatter, e.g. `maskCPF`. */
    mask:          (raw: string) => string;
    /** Return an error message, or undefined when valid. Runs on blur for non-empty values. */
    validate?:     (value: string) => string | undefined;
    /** Overrides the auto-detected `inputmode` (numeric for digit-only masks). */
    inputmode?:    HTMLInputAttributes['inputmode'];
    error?:        string;
    description?:  string;
    disabled?:     boolean;
    required?:     boolean;
    readonly?:     boolean;
    autocomplete?: HTMLInputAttributes['autocomplete'];
    leading?:      Snippet;
    trailing?:     Snippet;
    size?:         'sm' | 'md';
    class?:        string;
    name?:         string;
    oninput?:      (value: string) => void;
    onchange?:     (value: string) => void;
    onblur?:       (e: FocusEvent) => void;
  }

  let {
    mask,
    validate,
    inputmode,
    value = $bindable(''),
    error,
    oninput,
    onblur,
    ...rest
  }: Props = $props();

  let host = $state<HTMLElement>();
  let validationError = $state<string | undefined>();
  const shownError = $derived(error ?? validationError);

  // Digit-only masks (CPF, CEP, phone, date…) emit no letters for a letter+digit probe.
  const resolvedInputmode = $derived(
    inputmode ?? (/[a-z]/i.test(mask('a1b2c3d4e5f6g7h8i9j0k1')) ? 'text' : 'numeric'),
  );

  // TextField owns the <input>; attach the mask action + inputmode to it from outside.
  $effect(() => {
    const input = host?.querySelector<HTMLInputElement>('input');
    if (!input) return;
    input.inputMode = resolvedInputmode;
    const action = maskAction(input, mask);
    return () => action?.destroy?.();
  });
</script>

<div class="ca-masked" bind:this={host}>
  <TextField
    {...rest}
    bind:value
    error={shownError}
    oninput={(v) => {
      validationError = undefined;
      oninput?.(v);
    }}
    onblur={(e) => {
      validationError = value && validate ? validate(value) : undefined;
      onblur?.(e);
    }}
  />
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-masked {
      width: 100%;
    }
}
</style>
