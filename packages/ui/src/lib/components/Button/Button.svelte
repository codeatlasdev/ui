<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import Spinner from '../Spinner/Spinner.svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { button } from '../../i18n/groups/button.js';
  import { announce } from '../../utils/announce.js';
  const t = useMessages(button);

  type Variant = 'filled' | 'glass' | 'outlined' | 'ghost' | 'destructive';
  type Size = 'sm' | 'md' | 'lg';
  type Tone = 'brand' | 'neutral';
  type Align = 'center' | 'between';

  /** Own props, shared by both renderings. */
  interface Own {
    /** `filled` (default) is the primary action; `glass` is a tinted surface button (blur only under the glass and frosted styles). */
    variant?: Variant;
    /**
     * `'neutral'` draws `outlined` and `ghost` without brand colour (neutral label and border), for a
     * secondary action beside a brand `filled` one. Other variants ignore it.
     */
    tone?: Tone;
    size?: Size;
    disabled?: boolean;
    /** Shows a spinner in place of `leading`, sets `aria-busy` and blocks interaction. Label is kept. */
    loading?: boolean;
    fullWidth?: boolean;
    /** Renders an `<a>` styled as a button. Its attributes (`download`, `rel`, `hreflang`, `ping`, `referrerpolicy`) are then accepted. */
    href?: string;
    /** Anchor target, used with `href`. `"_blank"` adds `noopener noreferrer` to any `rel` you pass. */
    target?: string;
    class?: string;
    children?: Snippet;
    leading?: Snippet;
    trailing?: Snippet;
    /**
     * Marks `trailing` as a keyboard hint (`<Kbd>`): it is hidden below `md` and on touch screens
     * (`pointer: coarse`) and takes no space there, so the button is as wide as its label alone.
     */
    trailingHint?: boolean;
    /**
     * `'between'` pins the label to the start and `trailing` to the end (use with `fullWidth` or a
     * fixed width). The loading spinner stays in the leading slot. Default `'center'`.
     */
    align?: Align;
    onclick?: (e: MouseEvent) => void;
    'aria-label'?: string;
  }
  type Overridden = keyof Own | 'type' | 'form';
  // Attributes only one element has. The other branch types them `never`: TypeScript accepts an
  // excess property that exists in ANY union member until `href` narrows it, so without this
  // `<Button download>` (no href) would compile and then be spread on a <button>.
  type AnchorOnly = Exclude<keyof HTMLAnchorAttributes, keyof HTMLButtonAttributes | Overridden>;
  type ButtonOnly = Exclude<keyof HTMLButtonAttributes, keyof HTMLAnchorAttributes | Overridden>;
  /** The anchor's attributes (`download`, `rel`, `hreflang`, `ping`, `referrerpolicy`...) without the ones Button owns. */
  type AnchorAttributes = Omit<HTMLAnchorAttributes, Overridden> & Partial<Record<ButtonOnly, never>>;
  /** The button's attributes (`form`, `formaction`, `name`, `value`...) without the ones Button owns. */
  type ButtonAttributes = Omit<HTMLButtonAttributes, Overridden> & Partial<Record<AnchorOnly, never>>;

  /** With `href` it renders an `<a>` and takes the anchor's attributes. */
  type LinkProps = Own & AnchorAttributes & {
    href: string;
    /** MIME type hint of the linked resource. */
    type?: string;
    form?: never;
  };

  /** Without `href` it renders a `<button>` and takes the button's attributes. */
  type ButtonProps = Own & ButtonAttributes & {
    href?: undefined;
    target?: undefined;
    /**
     * Button type, default `'button'`. A submit button outside its `<form>` (a Dialog `actions`
     * footer) names it with `form="<form id>"`. The `string & {}` keeps the three values as
     * suggestions and still accepts the widened `string` that svelte-check emits for a static
     * `type="submit"` when the app has no `strict`; without it that call fails with `form: never`.
     */
    type?: 'button' | 'submit' | 'reset' | (string & {});
    /** `id` of the `<form>` this button submits, for a button outside it (a Dialog `actions` footer, a sticky action bar). A link rejects it. */
    form?: string;
  };

  type Props = LinkProps | ButtonProps;

  let {
    variant = 'filled',
    tone = 'brand',
    size = 'md',
    disabled = false,
    loading = false,
    type,
    fullWidth = false,
    href,
    target,
    class: className = '',
    children,
    leading,
    trailing,
    trailingHint = false,
    align = 'center',
    onclick,
    'aria-label': ariaLabel,
    ...restProps
  }: Props = $props();

  // `rest` is a union (anchor | button attributes); each element receives only its own half.
  const rest = $derived(restProps as AnchorAttributes & ButtonAttributes);

  const isDisabled = $derived(disabled || loading);
  const neutral = $derived(tone === 'neutral' && (variant === 'outlined' || variant === 'ghost'));

  // A new tab must not reach `window.opener`: add the tokens to whatever `rel` the caller passed (#290).
  const rel = $derived(
    target === '_blank' ? `${rest.rel ?? ''} noopener noreferrer`.trim() : (rest.rel ?? undefined)
  );

  // Tell assistive tech when the busy state ends (aria-busy alone is not announced on change).
  let wasLoading = false;
  $effect(() => {
    if (wasLoading && !loading) announce(t().button.loaded);
    wasLoading = loading;
  });
  const spinnerSize = $derived(size === 'lg' ? 18 : size === 'md' ? 16 : 14);
</script>

{#snippet leadingSlot()}
  {#if loading}
    <span class="ca-btn__leading" aria-hidden="true"><Spinner size={spinnerSize} /></span>
  {:else if leading}
    <span class="ca-btn__leading" aria-hidden="true">{@render leading()}</span>
  {/if}
{/snippet}

{#if href}
  <a
    {...rest}
    {href}
    {target}
    {type}
    {rel}
    class="ca-btn ca-btn--{variant} ca-btn--{size} {className}"
    class:ca-btn--neutral={neutral}
    class:ca-btn--between={align === 'between'}
    class:ca-btn--full-width={fullWidth}
    class:ca-btn--loading={loading}
    aria-disabled={isDisabled}
    aria-busy={loading || undefined}
    tabindex={isDisabled ? -1 : undefined}
    aria-label={ariaLabel}
    onclick={isDisabled ? (e) => e.preventDefault() : onclick}
  >
    {@render leadingSlot()}
    {@render children?.()}
    {#if trailing}
      <span class="ca-btn__trailing" class:ca-btn__trailing--hint={trailingHint} aria-hidden="true">{@render trailing()}</span>
    {/if}
  </a>
{:else}
  <button
    {...rest}
    type={(type as 'button' | 'submit' | 'reset' | undefined) ?? 'button'}
    disabled={isDisabled}
    class="ca-btn ca-btn--{variant} ca-btn--{size} {className}"
    class:ca-btn--neutral={neutral}
    class:ca-btn--between={align === 'between'}
    class:ca-btn--full-width={fullWidth}
    class:ca-btn--loading={loading}
    aria-disabled={isDisabled}
    aria-busy={loading || undefined}
    {onclick}
    aria-label={ariaLabel}
  >
    {@render leadingSlot()}
    {@render children?.()}
    {#if trailing}
      <span class="ca-btn__trailing" class:ca-btn__trailing--hint={trailingHint} aria-hidden="true">{@render trailing()}</span>
    {/if}
  </button>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ca-btn-gap, var(--ca-space-1-5));
      border-radius: var(--ca-radius-control);
      border: none;
      cursor: pointer;
      font-family: var(--ca-font-sans);
      font-weight: var(--ca-btn-font-weight, var(--ca-font-weight-medium));
      letter-spacing: var(--ca-btn-letter-spacing, var(--ca-label-tracking));
      line-height: var(--ca-btn-line-height, inherit);
      text-decoration: none;
      white-space: nowrap;
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color var(--ca-duration-fast) var(--ca-ease-standard),
        border-color var(--ca-duration-fast) var(--ca-ease-standard),
        box-shadow var(--ca-duration-fast) var(--ca-ease-standard),
        opacity var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-btn:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }

    /* Disabled is drawn from tokens, never from opacity: the label keeps a defined contrast
       (--ca-text-disabled is >= 3:1 on every surface and on the disabled fill). Each variant
       below restates it, so none keeps its enabled fill under a dimmed label. A loading button
       is busy, not unavailable: it keeps its enabled look (see the loading rule). */
    .ca-btn:disabled,
    .ca-btn[aria-disabled='true'] {
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Sizes: md aligns with TextField/Select height (--ca-control-height). Every value reads a
       component token first (--ca-btn-<size>-*, then --ca-btn-*): unset, it is the 4.5.0 look. */
    .ca-btn--sm {
      height: var(--ca-btn-sm-height, var(--ca-control-height-sm));
      padding: 0 var(--ca-btn-sm-padding-x, var(--ca-space-2-5));
      font-size: var(--ca-btn-sm-font-size, var(--ca-font-size-body2));
      font-weight: var(--ca-btn-sm-font-weight, var(--ca-btn-font-weight, var(--ca-font-weight-medium)));
      letter-spacing: var(--ca-btn-sm-letter-spacing, var(--ca-btn-letter-spacing, var(--ca-label-tracking)));
    }
    .ca-btn--md {
      height: var(--ca-btn-md-height, var(--ca-control-height));
      padding: 0 var(--ca-btn-md-padding-x, var(--ca-control-px));
      font-size: var(--ca-btn-md-font-size, var(--ca-font-size-button));
      font-weight: var(--ca-btn-md-font-weight, var(--ca-btn-font-weight, var(--ca-font-weight-medium)));
      letter-spacing: var(--ca-btn-md-letter-spacing, var(--ca-btn-letter-spacing, var(--ca-label-tracking)));
    }
    .ca-btn--lg {
      height: var(--ca-btn-lg-height, var(--ca-control-height-lg));
      padding: 0 var(--ca-btn-lg-padding-x, var(--ca-space-5));
      font-size: var(--ca-btn-lg-font-size, var(--ca-font-size-dialog));
      font-weight: var(--ca-btn-lg-font-weight, var(--ca-btn-font-weight, var(--ca-font-weight-medium)));
      letter-spacing: var(--ca-btn-lg-letter-spacing, var(--ca-btn-letter-spacing, var(--ca-label-tracking)));
    }

    /* Touch: every size reaches the 44px target (min-height wins over height). --ca-btn-touch-height
       is the explicit opt-out (e.g. 36px in a dense focus mode). */
    @media (pointer: coarse) {
      .ca-btn { min-height: var(--ca-btn-touch-height, var(--ca-touch-target)); }
      .ca-btn--lg { height: auto; }
    }

    /* Native-feeling press on touch devices. */
    @media (hover: none) and (prefers-reduced-motion: no-preference) {
      .ca-btn { transition-property: background, color, border-color, box-shadow, opacity, scale; }
      .ca-btn:active:not(:disabled) { scale: 0.97; transition-duration: var(--ca-duration-press); }
    }

    /* Filled */
    .ca-btn--filled {
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
    }
    .ca-btn--filled:hover:not(:disabled) {
      background: var(--ca-brand-fill-hover);
    }
    .ca-btn--filled:active:not(:disabled) {
      background: var(--ca-brand-fill-hover);
      box-shadow: inset 0 var(--ca-border-width) var(--ca-space-0-5) color-mix(in oklab, black 15%, transparent);
    }

    /* Glass */
    .ca-btn--glass {
      background: var(--ca-glass-tint);
      border: var(--ca-border-width) solid var(--ca-glass-border);
      color: var(--ca-text-primary);
      box-shadow: var(--ca-glass-shadow);
    }
    .ca-btn--glass:hover:not(:disabled) {
      background: var(--ca-glass-tint-thick);
    }

    /* Outlined */
    .ca-btn--outlined {
      background: transparent;
      border: var(--ca-border-width) solid var(--ca-brand-main);
      color: var(--ca-brand-text);
    }
    .ca-btn--outlined:hover:not(:disabled) {
      background: color-mix(in oklab, var(--ca-brand-main) 8%, transparent);
    }

    /* Ghost */
    .ca-btn--ghost {
      background: transparent;
      border: var(--ca-btn-ghost-border-width, var(--ca-border-width)) solid transparent;
      color: var(--ca-brand-text);
    }
    .ca-btn--ghost:hover:not(:disabled) {
      background: color-mix(in oklab, var(--ca-brand-main) 8%, transparent);
    }

    /* Neutral tone (outlined, ghost): a secondary action next to a brand one. Label, border and the
       hover/pressed fills come from neutral tokens, never --ca-brand-*. */
    .ca-btn--neutral.ca-btn--outlined {
      border-color: var(--ca-outline-control);
      color: var(--ca-text-primary);
    }
    .ca-btn--neutral.ca-btn--ghost {
      color: var(--ca-text-secondary);
    }
    .ca-btn--neutral:hover:not(:disabled) {
      background: var(--ca-action-hover);
    }
    .ca-btn--neutral.ca-btn--ghost:hover:not(:disabled) {
      color: var(--ca-text-primary);
    }
    .ca-btn--neutral:active:not(:disabled) {
      background: var(--ca-action-selected);
      color: var(--ca-text-primary);
    }

    /* Destructive */
    .ca-btn--destructive {
      background: var(--ca-semantic-error-fill);
      color: var(--ca-semantic-error-contrast);
    }
    .ca-btn--destructive:hover:not(:disabled) {
      background: color-mix(in oklab, var(--ca-semantic-error-fill) 85%, black);
    }

    .ca-btn__leading,
    .ca-btn__trailing {
      display: flex;
      align-items: center;
    }

    /* align="between": label at the start, trailing slot at the end. The spinner is the leading
       slot, so loading does not move it. */
    .ca-btn--between,
    .ca-btn--between.ca-btn--full-width {
      justify-content: flex-start;
    }
    .ca-btn--between .ca-btn__trailing {
      margin-inline-start: auto;
    }

    /* trailingHint: a keyboard hint is meaningless without a keyboard or room for it. display: none
       removes the slot from the flex row, so its gap goes with it. */
    @media (max-width: 899.98px), (pointer: coarse) {
      .ca-btn__trailing--hint { display: none; }
    }

    /* Disabled look, per variant. Declared after the variants so it wins at equal specificity;
       loading is excluded (busy, not unavailable). */
    .ca-btn:disabled:not(.ca-btn--loading),
    .ca-btn[aria-disabled='true']:not(.ca-btn--loading) {
      color: var(--ca-text-disabled);
      background: var(--ca-btn-disabled-bg, var(--ca-action-disabled-bg));
      border-color: var(--ca-outline-default);
      box-shadow: none;
    }
    .ca-btn--filled:disabled:not(.ca-btn--loading),
    .ca-btn--filled[aria-disabled='true']:not(.ca-btn--loading),
    .ca-btn--destructive:disabled:not(.ca-btn--loading),
    .ca-btn--destructive[aria-disabled='true']:not(.ca-btn--loading),
    .ca-btn--glass:disabled:not(.ca-btn--loading),
    .ca-btn--glass[aria-disabled='true']:not(.ca-btn--loading),
    .ca-btn--outlined:disabled:not(.ca-btn--loading),
    .ca-btn--outlined[aria-disabled='true']:not(.ca-btn--loading) {
      border: var(--ca-border-width) solid var(--ca-outline-default);
    }
    .ca-btn--ghost:disabled:not(.ca-btn--loading),
    .ca-btn--ghost[aria-disabled='true']:not(.ca-btn--loading) {
      background: transparent;
      border-color: transparent;
    }

    /* Loading: keeps the enabled look (it is busy, not unavailable); only the cursor changes.
       The spinner is tinted to the button's text color so it stays legible on every variant. */
    .ca-btn.ca-btn--loading:disabled,
    .ca-btn.ca-btn--loading[aria-disabled='true'] {
      cursor: progress;
    }
    .ca-btn--loading :global(.ca-spinner__track) {
      stroke: color-mix(in oklab, currentColor 25%, transparent);
    }
    .ca-btn--loading :global(.ca-spinner__arc) {
      stroke: currentColor;
    }

    .ca-btn--full-width {
      width: 100%;
      justify-content: center;
    }
}
</style>
