<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import type { IconComponent as IconType } from '../../types.js';
  import { X } from '@lucide/svelte';
  const t = useT();

  interface Props {
    label: string;
    icon?: IconType;
    deletable?: boolean;
    ondelete?: () => void;
    selected?: boolean;
    onclick?: () => void;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'brand';
    size?: 'sm' | 'md';
    class?: string;
  }

  let {
    label,
    icon: IconComponent,
    deletable = false,
    ondelete,
    selected = false,
    onclick,
    variant = 'default',
    size = 'md',
    class: className = '',
  }: Props = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<span
  class="ca-chip {className}"
  class:ca-chip--selected={selected}
  class:ca-chip--interactive={!!onclick}
  class:ca-chip--success={variant === 'success'}
  class:ca-chip--error={variant === 'error'}
  class:ca-chip--warning={variant === 'warning'}
  class:ca-chip--info={variant === 'info'}
  class:ca-chip--brand={variant === 'brand'}
  class:ca-chip--sm={size === 'sm'}
  role={onclick ? 'button' : undefined}
  tabindex={onclick ? 0 : undefined}
  aria-pressed={onclick ? selected : undefined}
  onclick={onclick}
  onkeydown={(e) => { if (onclick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onclick(); } }}
>
  {#if IconComponent}
    <span class="ca-chip__icon" aria-hidden="true">
      <IconComponent size={14} stroke-width={1.75} />
    </span>
  {/if}
  <span class="ca-chip__label">{label}</span>
  {#if deletable}
    <button
      class="ca-chip__delete"
      type="button"
      aria-label={t().chip.remove(label)}
      onclick={(e) => { e.stopPropagation(); ondelete?.(); }}
    >
      <X size={12} stroke-width={2} />
    </button>
  {/if}
</span>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1);
      height: var(--ca-space-7);
      border-radius: var(--ca-radius-chip);
      padding: 0 var(--ca-space-3);
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-secondary);
      background: var(--ca-chip-bg);
      -webkit-backdrop-filter: var(--ca-blur-thin);
      backdrop-filter: var(--ca-blur-thin);
      border: var(--ca-border-width) solid var(--ca-chip-border-color);
      box-shadow: var(--ca-chip-shadow);
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color var(--ca-duration-fast) var(--ca-ease-standard);
      user-select: none;
    }

    .ca-chip--interactive {
      cursor: pointer;
    }

    /* Touch: invisible 44px hit area without growing the chip. */
    @media (pointer: coarse) {
      .ca-chip--interactive { position: relative; }
      .ca-chip--interactive::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: max(100%, var(--ca-touch-target));
        height: max(100%, var(--ca-touch-target));
        translate: -50% -50%;
      }
    }

    .ca-chip--interactive:hover {
      background: var(--ca-action-hover);
      color: var(--ca-text-primary);
    }

    .ca-chip--selected {
      background: color-mix(in oklab, var(--ca-brand-main) 15%, var(--ca-glass-tint));
      border-color: color-mix(in oklab, var(--ca-brand-main) 40%, transparent);
      color: var(--ca-brand-text);
    }

    .ca-chip:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-border-width-focus);
    }

    .ca-chip__icon {
      display: flex;
      align-items: center;
      margin-left: calc(-1 * var(--ca-space-1));
    }

    .ca-chip__label {
      line-height: 1;
    }

    .ca-chip__delete {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--ca-space-4);
      height: var(--ca-space-4);
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
      margin-right: calc(-1 * var(--ca-space-1-5));
      padding: 0;
      transition: opacity var(--ca-duration-fast) var(--ca-ease-standard),
                  background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-chip__delete:hover {
      opacity: 1;
      background: var(--ca-action-hover);
    }

    .ca-chip__delete:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-border-width);
    }

    /* Variant colours */
    .ca-chip--success { background: color-mix(in oklab, var(--ca-semantic-success) 14%, transparent); color: color-mix(in oklab, var(--ca-semantic-success) 65%, black); border-color: color-mix(in oklab, var(--ca-semantic-success) 30%, transparent); }
    .ca-chip--error   { background: color-mix(in oklab, var(--ca-semantic-error)   14%, transparent); color: color-mix(in oklab, var(--ca-semantic-error)   65%, black); border-color: color-mix(in oklab, var(--ca-semantic-error)   30%, transparent); }
    .ca-chip--warning { background: color-mix(in oklab, var(--ca-semantic-warning) 14%, transparent); color: color-mix(in oklab, var(--ca-semantic-warning) 65%, black); border-color: color-mix(in oklab, var(--ca-semantic-warning) 30%, transparent); }
    .ca-chip--info    { background: color-mix(in oklab, var(--ca-semantic-info)    14%, transparent); color: color-mix(in oklab, var(--ca-semantic-info)    65%, black); border-color: color-mix(in oklab, var(--ca-semantic-info)    30%, transparent); }
    .ca-chip--brand   { background: color-mix(in oklab, var(--ca-brand-main) 14%, transparent); color: var(--ca-brand-text);  border-color: color-mix(in oklab, var(--ca-brand-main) 30%, transparent); }

    /* Dark mode variants: raise L for legibility */
    :global(.dark) .ca-chip--success { color: var(--ca-semantic-success); border-color: color-mix(in oklab, var(--ca-semantic-success) 35%, transparent); }
    :global(.dark) .ca-chip--error   { color: var(--ca-semantic-error);   border-color: color-mix(in oklab, var(--ca-semantic-error)   35%, transparent); }
    :global(.dark) .ca-chip--warning { color: var(--ca-semantic-warning); border-color: color-mix(in oklab, var(--ca-semantic-warning) 35%, transparent); }
    :global(.dark) .ca-chip--info    { color: var(--ca-semantic-info);    border-color: color-mix(in oklab, var(--ca-semantic-info)    35%, transparent); }

    /* Size */
    .ca-chip--sm { font-size: var(--ca-font-size-micro); height: var(--ca-space-5); padding: 0 var(--ca-space-2); }
}
</style>
