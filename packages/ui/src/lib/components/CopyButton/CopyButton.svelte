<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { Copy, Check } from '@lucide/svelte';
  import { onDestroy } from 'svelte';
  import Button from '../Button/Button.svelte';
  import IconButton from '../Button/IconButton.svelte';
  import { copyToClipboard } from '../../utils/clipboard.js';
  import { toast } from '../../stores/toast.svelte.js';
  import { announce } from '../../utils/announce.js';

  interface Props {
    value: string;
    /** Visible label. Pass `''` for an icon-only button. */
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'filled' | 'glass' | 'outlined' | 'ghost';
    /** Success toast message shown after copying. Omit for no toast. */
    toast?: string;
    class?: string;
    oncopy?: (value: string) => void;
  }

  let {
    value,
    label,
    size = 'md',
    variant = 'ghost',
    toast: toastMessage,
    class: className = '',
    oncopy,
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
  <Button {variant} {size} class="ca-copy {className}" onclick={copy} leading={icon}>
    {label ?? t().copyButton.label}
  </Button>
{:else}
  <IconButton variant={iconVariant} {size} class="ca-copy {className}" aria-label={t().copyButton.label} onclick={copy}>
    {@render icon()}
  </IconButton>
{/if}
