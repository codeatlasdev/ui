<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import { Copy, Check } from '@lucide/svelte';
  import { onDestroy } from 'svelte';
  import Button from '../Button/Button.svelte';
  import IconButton from '../Button/IconButton.svelte';
  import { copyToClipboard } from '../../utils/clipboard.js';
  import { toast } from '../../stores/toast.svelte.js';
  import { announce } from '../../utils/announce.js';
  import type { HTMLAttributes } from 'svelte/elements';
  const t = useT();

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'onclick' | 'oncopy' | 'aria-label'> {
    value: string;
    /** Visible label. Pass `''` for an icon-only button. */
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'filled' | 'glass' | 'outlined' | 'ghost';
    /** Success toast message shown after copying. Omit for no toast. */
    toast?: string;
    /** Accessible name of the icon-only button (`label=""`). Give each row its own ("Copy client_id of Acme"). Defaults to the localized `Copy`. Ignored when `label` is visible, so the name keeps containing the visible text. */
    'aria-label'?: string;
    class?: string;
    oncopy?: (value: string) => void;
  }

  let {
    value,
    label,
    size = 'md',
    variant = 'ghost',
    toast: toastMessage,
    'aria-label': ariaLabel,
    class: className = '',
    oncopy,
    ...rest
  }: Props = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    if (!(await copyToClipboard(value))) {
      toast.error(t().copyButton.failed);
      return;
    }
    copied = true;
    announce(t().copyButton.copied);
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 2000);
    if (toastMessage) toast.success(toastMessage);
    oncopy?.(value);
  }

  onDestroy(() => clearTimeout(timer));

  const iconSize = $derived(size === 'sm' ? 14 : 16);
  const iconVariant = $derived(variant === 'ghost' ? 'text' : variant === 'outlined' ? 'glass' : variant);
</script>

{#snippet icon()}
  {#if copied}
    <Check size={iconSize} stroke-width={2} />
  {:else}
    <Copy size={iconSize} stroke-width={2} />
  {/if}
{/snippet}

{#if label !== ''}
  <Button {...rest} {variant} {size} class="ca-copy {className}" onclick={copy} leading={icon}>
    {label ?? t().copyButton.label}
  </Button>
{:else}
  <IconButton {...rest} variant={iconVariant} {size} class="ca-copy {className}" aria-label={ariaLabel ?? t().copyButton.label} onclick={copy}>
    {@render icon()}
  </IconButton>
{/if}
