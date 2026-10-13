<script lang="ts">
  /**
   * Internal: renders the editable segments of a FieldState (role="spinbutton" per APG).
   * Not exported from the package.
   */
  import type { FieldState } from './field-state.svelte.js';

  interface Props {
    field: FieldState;
    /** Id of the visible label element (`aria-labelledby`). */
    labelId?: string;
    /** id of the node describing the field; applied to the first segment only. */
    describedBy?: string;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    /** Wrapper element + class (the DOM contract differs between a single field and a range). */
    tag?: 'span' | 'div';
    class?: string;
    role?: string;
    id?: string;
    /** Prefix for the segment ids. */
    base: string;
  }

  let {
    field,
    labelId,
    describedBy,
    disabled = false,
    readonly = false,
    invalid = false,
    tag = 'span',
    class: className = 'ca-date__input',
    role,
    id,
    base,
  }: Props = $props();

  const flag = (v: boolean) => (v ? '' : undefined);
  const firstEditable = $derived(field.segments.findIndex((s) => s.editable));
</script>

<svelte:element this={tag} class={className} {role} {id}>
  {#each field.segments as seg, i (i)}
    {#if seg.editable && seg.part !== 'literal'}
      {@const part = seg.part as 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second' | 'dayPeriod'}
      {@const sid = `${base}-${i}`}
      <span
        class="ca-date__segment"
        id={sid}
        role="spinbutton"
        contenteditable={disabled || readonly ? undefined : 'true'}
        tabindex={disabled ? undefined : 0}
        spellcheck="false"
        inputmode={part === 'dayPeriod' ? 'text' : 'numeric'}
        {...{ autocorrect: "off" }}
        enterkeyhint="next"
        aria-label={part === 'dayPeriod' ? 'AM/PM' : `${part}, `}
        aria-labelledby={labelId ? `${sid} ${labelId}` : undefined}
        aria-describedby={i === firstEditable ? describedBy : undefined}
        aria-valuemin={field.min(part)}
        aria-valuemax={field.max(part)}
        aria-valuenow={field.now(part)}
        aria-valuetext={field.valueText(part)}
        aria-disabled={disabled}
        aria-readonly={readonly}
        aria-invalid={invalid ? 'true' : undefined}
        data-segment={part}
        data-disabled={flag(disabled)}
        data-readonly={flag(readonly)}
        data-invalid={flag(invalid)}
        data-placeholder={field.texts[part] === null ? '' : undefined}
        style="caret-color: transparent;"
        onkeydown={(e) => field.onkeydown(part, e)}
        onfocus={() => field.onfocus(part)}
        onblur={() => field.onblur(part)}
        onbeforeinput={(e) => {
          if (!e.data || e.data.length <= 1) e.preventDefault();
        }}
        onclick={(e) => {
          if (disabled) e.preventDefault();
        }}
      >{seg.text}</span>
    {:else}
      <span
        class="ca-date__segment"
        aria-hidden="true"
        data-segment="literal"
        data-disabled={flag(disabled)}
        data-readonly={flag(readonly)}
      >{seg.text}</span>
    {/if}
  {/each}
</svelte:element>
