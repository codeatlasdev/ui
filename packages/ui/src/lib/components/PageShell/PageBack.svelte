<script lang="ts">
  /**
   * The back link of a page header (AppForm, AppSettings, PageShell): a ghost button rendered as an
   * `<a href={backHref}>`, so it works without JavaScript and opens in a new tab. `onback` runs on
   * click first and may `preventDefault()` to take over (a history-aware `back(fallback)`).
   */
  import { ArrowLeft } from '@lucide/svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { pageBack } from '../../i18n/groups/pageBack.js';
  import Button from '../Button/Button.svelte';
  const t = useMessages(pageBack);

  interface Props {
    href: string;
    label?: string;
    onback?: (e: MouseEvent) => void;
  }

  let { href, label, onback }: Props = $props();
</script>

<Button variant="ghost" size="sm" {href} aria-label={label ?? t().pageBack.back} onclick={onback}>
  {#snippet leading()}<ArrowLeft size={15} aria-hidden="true" />{/snippet}
</Button>
