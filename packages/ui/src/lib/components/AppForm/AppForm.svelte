<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
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
  import { provideSectionHeadingLevel } from '../PageShell/heading-context.js';
  import { ArrowLeft } from '@lucide/svelte';
  const t = useT();

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

  // The page <h1> is rendered above; titles inside the form default to <h2>.
  provideSectionHeadingLevel();

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
          {#if title}<h1 class="ca-app-form__title ca-sr-only--shell">{title}</h1>{/if}
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
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
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
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
    }

    .ca-app-form__header-inner {
      display: flex;
      align-items: center;
      gap: var(--ca-space-3);
      padding:
        var(--ca-page-pt)
        var(--ca-page-px)
        var(--ca-space-4);
      width: 100%;
      box-sizing: border-box;
    }

    .ca-app-form__meta    { flex: 1; min-width: 0; }
    .ca-app-form__leading  { flex-shrink: 0; }
    .ca-app-form__trailing { flex-shrink: 0; }

    .ca-app-form__title {
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-h5);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      margin: 0 0 var(--ca-space-0-5);
      line-height: var(--ca-line-height-tight);
    }

    .ca-app-form__desc {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      margin: 0;
      line-height: var(--ca-line-height-snug);
    }

    /* ── Scrollable body ─────────────────────────────────────────── */
    .ca-app-form__body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .ca-app-form__body::-webkit-scrollbar      { width: var(--ca-space-1-5); }
    .ca-app-form__body::-webkit-scrollbar-track { background: transparent; }
    .ca-app-form__body::-webkit-scrollbar-thumb {
      background: var(--ca-outline-default);
      border-radius: var(--ca-radius-pill);
    }

    .ca-app-form__inner {
      padding: var(--ca-space-6) var(--ca-page-px) var(--ca-space-10);
      display: flex;
      flex-direction: column;
      gap: var(--ca-page-gap);
      box-sizing: border-box;
      width: 100%;
    }

    /* ── Footer sticky ─────────────────────────────────────────────── */
    .ca-app-form__footer {
      flex-shrink: 0;
      border-top: var(--ca-border-width) solid var(--ca-outline-subtle);
      background: var(--ca-chrome-bg);
      -webkit-backdrop-filter: var(--ca-chrome-blur);
      backdrop-filter: var(--ca-chrome-blur);
    }

    .ca-app-form__footer-inner {
      padding: var(--ca-space-3) var(--ca-page-px);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--ca-space-2);
      box-sizing: border-box;
      width: 100%;
    }

    /* ── Mobile ─────────────────────────────────────────────────── */
    @media (max-width: 599.98px) {
      .ca-app-form__header-inner {
        padding:
          var(--ca-space-4)
          var(--ca-page-px-sm)
          var(--ca-space-3);
      }
      .ca-app-form__inner {
        padding:
          var(--ca-space-4)
          var(--ca-page-px-sm)
          var(--ca-space-8);
      }
      .ca-app-form__footer-inner {
        padding: var(--ca-space-3) var(--ca-page-px-sm);
        padding-bottom: calc(var(--ca-space-2-5) + var(--ca-safe-bottom));
      }
    }
}
</style>
