<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import Button from '../Button/Button.svelte';
  import { Home, RefreshCw, AlertTriangle, Search, ServerCrash } from '@lucide/svelte';
  const t = useT();

  interface Props {
    status?: number;
    message?: string;
    /** Override the title shown above the message */
    title?: string;
    /** Hide the back/home action buttons */
    hideActions?: boolean;
    class?: string;
  }

  let {
    status = 500,
    message,
    title,
    hideActions = false,
    class: className = '',
  }: Props = $props();

  // Derived title + icon per status
  const icons: Record<number, typeof Home> = { 404: Search, 403: AlertTriangle, 500: ServerCrash, 503: ServerCrash };

  // An explicit `message` wins over the preset hint; unknown statuses fall back to a generic title.
  let preset = $derived.by(() => {
    const m = t().errorPage;
    const known = status === 404 || status === 403 || status === 500 || status === 503 ? m[status] : undefined;
    return {
      title: known?.title ?? m.fallbackTitle,
      hint: message ?? known?.hint ?? m.defaultMessage,
      Icon: icons[status] ?? AlertTriangle,
    };
  });
  let displayTitle = $derived(title ?? preset.title);
  let IconComponent = $derived(preset.Icon);

  function goBack() { history.back(); }
  function goHome() { location.href = '/'; }
</script>

<div class="ca-error-page {className}">
  <div class="ca-error-page__inner">
    <!-- Status glow bubble -->
    <div class="ca-error-page__bubble" aria-hidden="true">
      <IconComponent size={32} stroke-width={1.5} />
    </div>

    <p class="ca-error-page__status">{status}</p>
    <h1 class="ca-error-page__title">{displayTitle}</h1>
    <p class="ca-error-page__hint">{preset.hint}</p>

    {#if !hideActions}
      <div class="ca-error-page__actions">
        <Button variant="outlined" onclick={goBack}>
          {#snippet leading()}<RefreshCw size={16} />{/snippet}
          {t().errorPage.goBack}
        </Button>
        <Button onclick={goHome}>
          {#snippet leading()}<Home size={16} />{/snippet}
          {t().errorPage.home}
        </Button>
      </div>
    {/if}
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-error-page {
      min-height: var(--ca-vh);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--ca-space-6);
    }

    .ca-error-page__inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--ca-space-4);
      max-width: calc(var(--ca-space-unit) * 120);
    }

    .ca-error-page__bubble {
      width: calc(var(--ca-space-unit) * 18);
      height: calc(var(--ca-space-unit) * 18);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in oklab, var(--ca-brand-main) 12%, transparent);
      border: var(--ca-border-width) solid color-mix(in oklab, var(--ca-brand-main) 25%, transparent);
      color: var(--ca-brand-text);
      -webkit-backdrop-filter: var(--ca-blur-regular);
      backdrop-filter: var(--ca-blur-regular);
      margin-bottom: var(--ca-space-2);
    }

    .ca-error-page__status {
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-bold);
      letter-spacing: var(--ca-overline-tracking);
      text-transform: uppercase;
      color: var(--ca-brand-text);
      margin: 0;
    }

    .ca-error-page__title {
      font-family: var(--ca-font-display);
      font-size: clamp(var(--ca-font-size-h3), 4vw, var(--ca-font-size-h1));
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      line-height: 1.15;
      color: var(--ca-text-primary);
      margin: 0;
    }

    .ca-error-page__hint {
      font-size: var(--ca-font-size-body1);
      color: var(--ca-text-secondary);
      line-height: var(--ca-line-height-prose);
      margin: 0;
      max-width: calc(var(--ca-space-unit) * 90);
    }

    .ca-error-page__actions {
      display: flex;
      gap: var(--ca-space-2-5);
      flex-wrap: wrap;
      justify-content: center;
      margin-top: var(--ca-space-2);
    }
}
</style>
