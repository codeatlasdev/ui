<script lang="ts">
  import { Check, ChevronDown, Globe } from '@lucide/svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { localeSwitcher } from '../../i18n/groups/localeSwitcher.js';
  import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuRadioGroup from '../DropdownMenu/DropdownMenuRadioGroup.svelte';
  import DropdownMenuRadioItem from '../DropdownMenu/DropdownMenuRadioItem.svelte';
  const t = useMessages(localeSwitcher);

  interface LocaleOption {
    /** Locale code your app uses: `pt-BR`, `en`. Passed to `onselect`. */
    value: string;
    /** The language's own name: "Português", "English". */
    label: string;
    /** Short code for narrow screens. Default: the first two letters of `value`, uppercased. */
    short?: string;
    /** BCP 47 tag for the `lang` attribute of the item. Default: `value`. */
    lang?: string;
  }

  interface Props {
    /** The languages on offer, each named in its own language. */
    options: LocaleOption[];
    /** Current locale (an option `value`). Bindable; it changes only after `onselect` succeeds. */
    value?: string;
    /**
     * Called with the picked locale. May return a promise: the switcher stays busy until it settles,
     * so the host can save the preference, set the cookie and navigate (`/en/login`) first. If it
     * rejects, `value` keeps its previous value and `onerror` is called.
     */
    onselect?: (value: string) => void | Promise<void>;
    /** Called when `onselect` throws or rejects. */
    onerror?: (error: unknown) => void;
    /** `true` always shows the short code. Default shows the name from 600px and the code below. */
    compact?: boolean;
    /** Accessible name prefix. Default "Language" (localized). */
    label?: string;
    align?: 'start' | 'center' | 'end';
    class?: string;
  }

  let {
    options,
    value = $bindable(),
    onselect,
    onerror,
    compact = false,
    label,
    align = 'end',
    class: className = '',
  }: Props = $props();

  let busy = $state(false);
  let open = $state(false);

  const current = $derived(options.find((o) => o.value === value) ?? options[0]);
  const code = (o: LocaleOption | undefined) => o?.short ?? o?.value.slice(0, 2).toUpperCase() ?? '';
  const name = $derived(label ?? t().localeSwitcher.label);

  async function pick(next: string) {
    if (busy || next === value) return;
    busy = true;
    try {
      await onselect?.(next);
      value = next;
    } catch (e) {
      onerror?.(e);
    } finally {
      busy = false;
      open = false;
    }
  }
</script>

<DropdownMenu bind:open {align}>
  {#snippet triggerChild(props)}
    <button
      {...props}
      type="button"
      class="ca-locale {compact ? 'ca-locale--compact' : ''} {className}"
      aria-busy={busy || undefined}
      disabled={busy}
    >
      <Globe size={16} aria-hidden="true" />
      <span class="ca-sr-only">{name}:</span>
      <span class="ca-locale__name" lang={current?.lang ?? current?.value}>{current?.label}</span>
      <span class="ca-locale__code" lang={current?.lang ?? current?.value}>{code(current)}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </button>
  {/snippet}
  <DropdownMenuRadioGroup value={value ?? current?.value} aria-label={name} onValueChange={pick}>
    {#each options as opt (opt.value)}
      <DropdownMenuRadioItem value={opt.value} lang={opt.lang ?? opt.value} disabled={busy}>
        {opt.label}
      </DropdownMenuRadioItem>
    {/each}
  </DropdownMenuRadioGroup>
</DropdownMenu>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-locale {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1-5);
      min-height: var(--ca-control-height);
      padding: 0 var(--ca-space-2);
      border: none;
      border-radius: var(--ca-radius-control);
      background: transparent;
      color: var(--ca-text-secondary);
      font: inherit;
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-medium);
      cursor: pointer;
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-locale:hover:not(:disabled) {
      background: var(--ca-action-hover);
      color: var(--ca-text-primary);
    }
    .ca-locale:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(var(--ca-border-width-focus) * -1);
    }
    .ca-locale:disabled { cursor: progress; opacity: 0.7; }

    .ca-locale__code { display: none; }
    .ca-locale--compact .ca-locale__name { display: none; }
    .ca-locale--compact .ca-locale__code { display: inline; }
    @media (max-width: 599.98px) {
      .ca-locale__name { display: none; }
      .ca-locale__code { display: inline; }
    }
}
</style>
