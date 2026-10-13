<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  /**
   * AppForm: page-level form layout.
   *
   * ┌──────────────────────────────────────────────────────────────┐
   * │  [←]  New User                                               │  header
   * │        Fill in the details below.                            │
   * ├──────────────────────────────────────────────────────────────┤
   * │                                                              │
   * │  ┌─ Account ──────────────────────────────────────────────┐  │
   * │  │  Name ______________   Email _______________________    │  │  body (scroll)
   * │  └────────────────────────────────────────────────────────┘  │
   * │                                                              │
   * ├──────────────────────────────────────────────────────────────┤
   * │  [Cancel]                              [Save changes]        │  footer (sticky)
   * └──────────────────────────────────────────────────────────────┘
   *
   * Minimal usage:
   *
   *   <AppForm title="New User">
   *     <FormSection title="Account">
   *       <TextField label="Name" bind:value={name} />
   *       <TextField label="Email" type="email" bind:value={email} />
   *     </FormSection>
   *     {#snippet footer()}
   *       <Button variant="ghost" href="/users">Cancel</Button>
   *       <Button variant="filled" onclick={save}>Save</Button>
   *     {/snippet}
   *   </AppForm>
   */
  import type { Snippet } from 'svelte';
  import Button from '../Button/Button.svelte';
  import { ArrowLeft } from '@lucide/svelte';

  interface Props {
    title?:       string;
    description?: string;
    /** Convenience prop: renders a back-arrow button linking to this href.
     *  Ignored when a `leading` snippet is provided. */
    backHref?:    string;
    /** Accessible label for the auto-rendered back button. Default: 'Back' */
    backLabel?:   string;
    /** Left side of header: back button, breadcrumb.
     *  When present, overrides backHref. */
    leading?:     Snippet;
    /** Right side of header: status chip, secondary actions */
    trailing?:    Snippet;
    /** Sticky bottom bar: cancel / save / delete */
    footer?:      Snippet;
    class?:       string;
    children?:    Snippet;
  }

  let {
    title,
    description,
    backHref,
    backLabel,
    leading,
    trailing,
    footer,
    class: className = '',
    children,
  }: Props = $props();

  /** True when the header row should be rendered */
  const showHeader = $derived(
    !!(title || description || leading || trailing || backHref),
  );
</script>

<div class="ca-app-form {className}">

  <!-- Header: full-width bg, content centered by --af-max -->
  {#if showHeader}
    <div class="ca-app-form__header">
      <div class="ca-app-form__header-inner">
        {#if leading}
          <div class="ca-app-form__leading">{@render leading()}</div>
        {:else if backHref}
          <div class="ca-app-form__leading">
            <Button variant="ghost" size="sm" href={backHref} aria-label={backLabel ?? t().appForm.back}>
              {#snippet leading()}<ArrowLeft size={15} />{/snippet}
            </Button>
          </div>
        {/if}
        <div class="ca-app-form__meta">
          {#if title}<h1 class="ca-app-form__title">{title}</h1>{/if}
          {#if description}<p class="ca-app-form__desc">{description}</p>{/if}
        </div>
        {#if trailing}
          <div class="ca-app-form__trailing">{@render trailing()}</div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Body: the only scrollable block -->
  <div class="ca-app-form__body">
    <div class="ca-app-form__inner">
      {@render children?.()}
    </div>
  </div>

  <!-- Sticky footer with glass blur -->
  {#if footer}
    <div class="ca-app-form__footer" role="toolbar" aria-label={t().appForm.actions}>
      <div class="ca-app-form__footer-inner">
        {@render footer()}
      </div>
    </div>
  {/if}

</div>

<style>
  /* ── Root ──────────────────────────────────────────────────────── */
  .ca-app-form {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    width: 100%;
  }

  /* ── Header ─────────────────────────────────────────────────────
     Full-width border-bottom. Content centered by --af-max.
     Global padding tokens, for consistency with AppList/AppSettings.
  ────────────────────────────────────────────────────────────────── */
  .ca-app-form__header {
    flex-shrink: 0;
    border-bottom: 1px solid var(--ca-outline-subtle);
  }

  .ca-app-form__header-inner {
    display: flex;
    align-items: center;
    gap: var(--ca-space-3, 12px);
    padding:
      var(--ca-page-pt, 20px)
      var(--ca-page-px, 24px)
      var(--ca-space-4, 16px);
    width: 100%;
    box-sizing: border-box;
  }

  .ca-app-form__meta    { flex: 1; min-width: 0; }
  .ca-app-form__leading  { flex-shrink: 0; }
  .ca-app-form__trailing { flex-shrink: 0; }

  .ca-app-form__title {
    font-size: var(--ca-font-size-h5);
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--ca-text-primary);
    margin: 0 0 2px;
    line-height: 1.2;
  }

  .ca-app-form__desc {
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  /* ── Scrollable body ─────────────────────────────────────────── */
  .ca-app-form__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .ca-app-form__body::-webkit-scrollbar      { width: 5px; }
  .ca-app-form__body::-webkit-scrollbar-track { background: transparent; }
  .ca-app-form__body::-webkit-scrollbar-thumb {
    background: var(--ca-outline-default);
    border-radius: 999px;
  }

  .ca-app-form__inner {
    padding: var(--ca-space-6, 24px) var(--ca-page-px, 24px) var(--ca-space-10, 40px);
    display: flex;
    flex-direction: column;
    gap: var(--ca-page-gap, 20px);
    box-sizing: border-box;
    width: 100%;
  }

  /* ── Footer sticky ─────────────────────────────────────────────── */
  .ca-app-form__footer {
    flex-shrink: 0;
    border-top: 1px solid var(--ca-outline-subtle);
    background: var(--ca-chrome-bg, var(--ca-glass-tint-chrome));
    -webkit-backdrop-filter: var(--ca-chrome-blur, blur(20px) saturate(1.5));
    backdrop-filter: var(--ca-chrome-blur, blur(20px) saturate(1.5));
  }

  .ca-app-form__footer-inner {
    padding: var(--ca-space-3, 12px) var(--ca-page-px, 24px);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--ca-space-2, 8px);
    box-sizing: border-box;
    width: 100%;
  }

  /* ── Mobile ─────────────────────────────────────────────────── */
  @media (max-width: 599px) {
    .ca-app-form__header-inner {
      padding:
        var(--ca-space-4, 16px)
        var(--ca-page-px-sm, 16px)
        var(--ca-space-3, 12px);
    }
    .ca-app-form__inner {
      padding:
        var(--ca-space-4, 16px)
        var(--ca-page-px-sm, 16px)
        var(--ca-space-8, 32px);
    }
    .ca-app-form__footer-inner {
      padding: var(--ca-space-3, 10px) var(--ca-page-px-sm, 16px);
      padding-bottom: calc(10px + var(--ca-safe-bottom));
    }
  }

  /* Inside AppShellLayout the mobile header (< 900px) already shows the page title:
     keep the h1 for assistive tech, hide it visually. */
  @media (max-width: 899px) {
    :global(.ca-shell__content) .ca-app-form__title {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  }
</style>
