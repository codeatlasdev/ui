<script lang="ts">
  /**
   * CopyField: a read-only value (an API key, a webhook URL, a recovery code, a curl command) with a
   * copy button beside it. Single line by default; `multiline` wraps a long value in a code box.
   * `mask` hides the value behind dots with a reveal toggle (copy always copies the real value).
   *
   *   <CopyField label="API key" value={secret} copyLabel="Copy key" toast="Key copied" mask />
   *   <CopyField label="Webhook URL" value={url} iconOnly />
   *
   * The box is `user-select: all` (one click selects the whole value) and wraps with
   * `overflow-wrap: anywhere`, so a 200-character token never scrolls the page sideways. The button
   * is a `CopyButton`: failure raises the localized error, success is announced.
   */
  import { Eye, EyeOff } from '@lucide/svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { copyField } from '../../i18n/groups/copyField.js';
  import { uid } from '../../utils/index.js';
  import CopyButton from '../CopyButton/CopyButton.svelte';
  import IconButton from '../Button/IconButton.svelte';
  const t = useMessages(copyField);

  interface Props {
    /** The value shown and copied. */
    value: string;
    /** Names the value box. Visible above it unless `hideLabel`. */
    label: string;
    /** Keeps `label` for assistive tech only (`.ca-sr-only`). */
    hideLabel?: boolean;
    /** Help text under the box, read as the box's description. */
    description?: string;
    /** Wraps the value on several lines (a command, a base64 key) instead of truncating one line. */
    multiline?: boolean;
    /** Shows dots instead of the value, with a reveal toggle. Copy still copies the real value. */
    mask?: boolean;
    /** Visible label of the copy button. Default: the localized "Copy". */
    copyLabel?: string;
    /** An icon-only copy button (compact), named from `label`. */
    iconOnly?: boolean;
    /** Success toast message after copying. Omit for no toast. */
    toast?: string;
    size?: 'sm' | 'md';
    class?: string;
    oncopy?: (value: string) => void;
  }

  let {
    value,
    label,
    hideLabel = false,
    description,
    multiline = false,
    mask = false,
    copyLabel,
    iconOnly = false,
    toast,
    size = 'md',
    class: className = '',
    oncopy,
  }: Props = $props();

  const id = uid('cf');
  let revealed = $state(false);
  const hidden = $derived(mask && !revealed);
  const shown = $derived(hidden ? '•'.repeat(Math.min(value.length, 24)) : value);
</script>

<div class="ca-cf {className}" class:ca-cf--sm={size === 'sm'} class:ca-cf--multiline={multiline}>
  <span id="{id}-label" class="ca-cf__label" class:ca-sr-only={hideLabel}>{label}</span>
  <div class="ca-cf__row">
    <div
      class="ca-cf__value"
      role="textbox"
      aria-readonly="true"
      aria-multiline={multiline ? 'true' : undefined}
      aria-labelledby="{id}-label"
      aria-describedby={description ? `${id}-desc` : undefined}
      tabindex="0"
    >{shown}</div>
    {#if mask}
      <IconButton
        variant="glass"
        {size}
        aria-label={revealed ? t().copyField.hide : t().copyField.reveal}
        aria-pressed={revealed}
        onclick={() => (revealed = !revealed)}
      >
        {#if revealed}<EyeOff size={size === 'sm' ? 14 : 16} aria-hidden="true" />{:else}<Eye size={size === 'sm' ? 14 : 16} aria-hidden="true" />{/if}
      </IconButton>
    {/if}
    {#if iconOnly}
      <CopyButton {value} label="" {size} variant="outlined" {toast} {oncopy} aria-label={`${t().copyField.copy}: ${label}`} />
    {:else}
      <CopyButton {value} label={copyLabel} {size} variant="filled" {toast} {oncopy} />
    {/if}
  </div>
  {#if description}<p id="{id}-desc" class="ca-cf__desc">{description}</p>{/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-cf {
      display: flex;
      flex-direction: column;
      gap: var(--ca-cf-gap, var(--ca-field-gap, var(--ca-space-1)));
      width: 100%;
      min-width: 0;
      container-type: inline-size;
    }

    .ca-cf__label {
      font-size: var(--ca-font-size-label);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
      line-height: var(--ca-field-label-leading, var(--ca-line-height-snug));
    }

    .ca-cf__row {
      display: flex;
      align-items: flex-start;
      gap: var(--ca-space-2);
      min-width: 0;
    }

    .ca-cf__value {
      flex: 1 1 14rem;
      min-width: 0;
      display: flex;
      align-items: center;
      min-height: var(--ca-control-height);
      padding: var(--ca-space-1-5) var(--ca-space-2-5);
      box-sizing: border-box;
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-md);
      background: var(--ca-surface-sunken, var(--ca-surface-base));
      color: var(--ca-text-primary);
      font: var(--ca-font-size-caption) / var(--ca-code-line-height) var(--ca-font-mono);
      user-select: all;
      overflow-wrap: anywhere;
      white-space: normal;
      overflow: hidden;
    }

    /* One line: truncate, the whole value is still selectable and copied. */
    .ca-cf:not(.ca-cf--multiline) .ca-cf__value {
      display: block;
      white-space: nowrap;
      overflow-wrap: normal;
      text-overflow: ellipsis;
      line-height: calc(var(--ca-control-height) - 2 * var(--ca-space-1-5) - 2 * var(--ca-border-width));
    }

    .ca-cf--multiline .ca-cf__value { white-space: pre-wrap; }

    .ca-cf__value:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: 0;
    }

    .ca-cf--sm .ca-cf__value { min-height: calc(var(--ca-control-height) - var(--ca-space-1-5)); }

    .ca-cf__desc {
      margin: 0;
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
    }

    /* The row wraps under a phone-sized box: the button drops below instead of squeezing the value. */
    @container (max-width: 24rem) {
      .ca-cf__row { flex-wrap: wrap; }
    }
}
</style>
