<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { IconComponent } from '../../types.js';
  import { devWarn } from '../../utils/dev-warn.js';
  import '../ToggleGroup/toggle-group.css';

  interface Props extends Omit<HTMLButtonAttributes, 'class' | 'children' | 'onchange' | 'onclick'> {
    /** Bindable. `true` while the toggle is pressed (`aria-pressed`). */
    pressed?: boolean;
    /** Visible text. Without it the toggle is icon-only and needs `aria-label`. */
    label?: string;
    icon?: IconComponent;
    size?: 'sm' | 'md';
    variant?: 'outlined' | 'ghost';
    disabled?: boolean;
    class?: string;
    /** Content after the icon and label. */
    children?: Snippet;
    onchange?: (pressed: boolean) => void;
  }

  let {
    pressed = $bindable(false),
    label,
    icon: Icon,
    size = 'md',
    variant = 'outlined',
    disabled = false,
    class: className = '',
    children,
    onchange,
    ...rest
  }: Props = $props();

  // An icon-only toggle has no text to name it; JS callers and spreads bypass the types.
  $effect(() => {
    if (!label && !children && !rest['aria-label']?.trim() && !rest['aria-labelledby'])
      devWarn('toggle-label', '<Toggle> has no accessible name. Pass label, aria-label (or aria-labelledby).');
  });

  function toggle() {
    if (disabled) return;
    pressed = !pressed;
    onchange?.(pressed);
  }
</script>

<span class="ca-toggle-group ca-toggle-group--{variant} ca-toggle-group--{size}">
  <button
    {...rest}
    type="button"
    aria-pressed={pressed}
    {disabled}
    data-state={pressed ? 'on' : 'off'}
    data-disabled={disabled ? '' : undefined}
    class="ca-toggle-group__item ca-toggle {className}"
    onclick={toggle}
  >
    {#if Icon}<Icon size={size === 'sm' ? 14 : 16} stroke-width={2} />{/if}
    {#if label}<span>{label}</span>{/if}
    {@render children?.()}
  </button>
</span>
