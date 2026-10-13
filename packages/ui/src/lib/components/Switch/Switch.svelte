<script lang="ts">
  interface Props {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    /** Accessible name when no visible `label` is rendered. */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    class?: string;
    onchange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    label,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    class: className = '',
    onchange,
  }: Props = $props();

  const switchId = $props.id();
</script>

<div class="ca-switch-wrapper {className}">
  <!-- Native checkbox with role="switch" is the control (keyboard, form, label association);
       the track and thumb around it only paint. -->
  <span class="ca-switch" data-state={checked ? 'checked' : 'unchecked'} data-disabled={disabled ? '' : undefined}>
    <input
      id={switchId}
      type="checkbox"
      role="switch"
      class="ca-switch__input"
      {checked}
      {disabled}
      aria-checked={checked}
      aria-label={label ? undefined : ariaLabel}
      aria-labelledby={label ? undefined : ariaLabelledby}
      onchange={(e) => {
        checked = e.currentTarget.checked;
        onchange?.(checked);
      }}
      onkeydown={(e) => {
        // APG switch: Space (native) and Enter both toggle.
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
    />
    <span class="ca-switch__thumb" aria-hidden="true"></span>
  </span>
  {#if label}
    <label for={switchId} class="ca-switch__label" class:ca-switch__label--disabled={disabled}>
      {label}
    </label>
  {/if}
</div>

<style>
  .ca-switch-wrapper {
    display: inline-flex;
    align-items: center;
    gap: var(--ca-space-2-5);
  }

  :global(.ca-switch) {
    /* Geometry from the spacing scale; thumb travel is derived so it stays flush at any density. */
    --_track-w: calc(var(--ca-space-10) + var(--ca-space-1));
    --_track-h: var(--ca-space-6);
    --_pad: var(--ca-space-0-5);
    --_thumb: calc(var(--_track-h) - 2 * var(--_pad));
    display: inline-flex;
    align-items: center;
    width: var(--_track-w);
    height: var(--_track-h);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-outline-default);
    border: none;
    cursor: pointer;
    padding: var(--_pad);
    flex-shrink: 0;
    transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    position: relative;
  }

  :global(.ca-switch[data-state='checked']) {
    background: var(--ca-brand-main);
  }

  :global(.ca-switch[data-disabled]) {
    cursor: not-allowed;
    opacity: 0.45;
  }

  :global(.ca-switch:has(.ca-switch__input:focus-visible)) {
    outline: var(--ca-border-width-focus) solid var(--ca-brand-main);
    outline-offset: var(--ca-focus-ring-offset);
  }

  :global(.ca-switch__input) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }

  :global(.ca-switch__thumb) {
    display: block;
    width: var(--_thumb);
    height: var(--_thumb);
    border-radius: 50%;
    background: oklch(1 0 0);
    box-shadow: var(--ca-shadow-sm);
    transition: transform var(--ca-duration-fast) var(--ca-ease-spring);
    transform: translateX(0);
    flex-shrink: 0;
    pointer-events: none;
  }

  :global(.ca-switch[data-state='checked'] .ca-switch__thumb) {
    transform: translateX(calc(var(--_track-w) - var(--_track-h)));
  }

  .ca-switch__label {
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
    cursor: pointer;
    user-select: none;
  }

  .ca-switch__label--disabled {
    color: var(--ca-text-disabled);
    cursor: not-allowed;
  }
</style>
