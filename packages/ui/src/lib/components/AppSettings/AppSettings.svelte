<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  /**
   * AppSettings: settings/preferences page layout.
   *
   * ┌──────────────────────────────────────────────────────────────┐
   * │  Settings                                  [Save changes]    │  header
   * ├────────────┬─────────────────────────────────────────────────┤
   * │            │                                                  │
   * │  General   │  ┌─ Workspace ─────────────────────────────┐    │
   * │  Notifs    │  │  Name ________  Slug ___________         │    │  body
   * │  Members   │  └──────────────────────────────────────────┘    │
   * │  Security  │                                                   │
   * │            │  ┌─ Danger Zone ────────────────────────────┐    │
   * │            │  │  Delete workspace             [Delete]    │    │
   * │            │  └──────────────────────────────────────────┘    │
   * └────────────┴─────────────────────────────────────────────────┘
   *
   * Behavior:
   * - The right-hand content takes ALL the available width, with no max-width on the container.
   *   FormSection, not AppSettings, controls the maximum width of fields.
   * - Left nav: fixed, does not scroll.
   * - Right-hand content: the only block that scrolls.
   * - Header: pinned to the top.
   *
   * Minimal usage, with internally managed state:
   *
   *   <AppSettings title="Settings" tabs={TABS}>
   *     {#snippet actions()}<Button onclick={save}>Save</Button>{/snippet}
   *     {#snippet children(tab)}
   *       {#if tab === 'general'}
   *         <FormSection title="Workspace">
   *           <TextField label="Name" bind:value={name} />
   *         </FormSection>
   *       {/if}
   *     {/snippet}
   *   </AppSettings>
   *
   * With external control (bind:activeTab):
   *
   *   <AppSettings tabs={TABS} bind:activeTab={tab} onTabChange={handleChange}>
   *     {#snippet children(tab)}…{/snippet}
   *   </AppSettings>
   */
  import type { IconComponent } from '../../types.js';
  import type { Snippet } from 'svelte';
  import { provideSectionHeadingLevel } from '../PageShell/heading-context.js';
  const t = useT();
  // The page <h1> is rendered above; titles inside the page default to <h2>.
  provideSectionHeadingLevel();

  interface SettingsTab {
    value:   string;
    label:   string;
    icon?:   IconComponent;
    badge?:  number;
    /** Renders the item in error/danger color */
    danger?: boolean;
  }

  interface Props {
    title?:        string;
    description?:  string;
    tabs:          SettingsTab[];
    /** Initial active tab. Defaults to first tab's value. */
    defaultTab?:   string;
    /** Bindable for external control. If omitted, state is managed internally. */
    activeTab?:    string;
    /** Optional callback when tab changes */
    onTabChange?:  (value: string) => void;
    /** Top-right slot: save / cancel buttons */
    actions?:      Snippet;
    class?:        string;
    /** Receives the active tab value as its first argument */
    children?:     Snippet<[string]>;
  }

  let {
    title,
    description,
    tabs,
    defaultTab,
    activeTab = $bindable(defaultTab ?? tabs[0]?.value ?? ''),
    onTabChange,
    actions,
    class: className = '',
    children,
  }: Props = $props();

  function selectTab(value: string) {
    activeTab = value;
    onTabChange?.(value);
  }
</script>

<div class="ca-app-settings {className}">

  <!-- ── Header ─────────────────────────────────────────────────── -->
  <div class="ca-app-settings__header">
    <div class="ca-app-settings__meta">
      {#if title}<h1 class="ca-app-settings__title ca-sr-only--shell">{title}</h1>{/if}
      {#if description}<p class="ca-app-settings__desc">{description}</p>{/if}
    </div>
    {#if actions}
      <div class="ca-app-settings__actions">{@render actions()}</div>
    {/if}
  </div>

  <!-- ── Body ───────────────────────────────────────────────────── -->
  <div class="ca-app-settings__body">

    <!-- Left nav: does not scroll -->
    <div class="ca-app-settings__nav" aria-label={t().appSettings.navigation} role="tablist">
      {#each tabs as tab}
        {@const active = tab.value === activeTab}
        <button
          type="button"
          class="ca-app-settings__nav-item"
          class:active
          class:danger={tab.danger}
          role="tab"
          aria-selected={active}
          onclick={() => selectTab(tab.value)}
        >
          {#if tab.icon}
            {@const Icon = tab.icon}
            <Icon
              size={15}
              stroke-width={active ? 2.2 : 1.6}
              class="ca-app-settings__nav-icon"
            />
          {/if}
          <span class="ca-app-settings__nav-label">{tab.label}</span>
          {#if tab.badge != null}
            <span class="ca-app-settings__nav-badge">{tab.badge}</span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Right-hand content: the only block that scrolls -->
    <div class="ca-app-settings__content" role="tabpanel" aria-label={t().appSettings.content}>
      {@render children?.(activeTab)}
    </div>

  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* ── Root ──────────────────────────────────────────────────────
       Fills the whole ca-shell__content (display:flex flex-col overflow:hidden).
    ─────────────────────────────────────────────────────────────── */
    .ca-app-settings {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      width: 100%;
    }

    /* ── Header ────────────────────────────────────────────────────
       Consistent with AppList and AppForm: uses --ca-page-px and --ca-page-pt.
    ─────────────────────────────────────────────────────────────── */
    .ca-app-settings__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-4);
      padding:
        var(--ca-page-pt)
        var(--ca-page-px)
        var(--ca-space-4);
      flex-shrink: 0;
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
    }

    .ca-app-settings__meta { flex: 1; min-width: 0; }

    .ca-app-settings__title {
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-h5);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      margin: 0 0 var(--ca-space-0-5);
      line-height: var(--ca-line-height-tight);
    }

    .ca-app-settings__desc {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      margin: 0;
      line-height: var(--ca-line-height-snug);
    }

    .ca-app-settings__actions {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      flex-shrink: 0;
    }

    /* ── Body ───────────────────────────────────────────────────────
       Flex row: fixed nav + scrollable content side by side.
    ─────────────────────────────────────────────────────────────── */
    .ca-app-settings__body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* ── Left nav ───────────────────────────────────────────────
       Width: 55 space units. Does not scroll (unless it has many items).
       Padding uses the global tokens.
    ─────────────────────────────────────────────────────────────── */
    .ca-app-settings__nav {
      width: calc(var(--ca-space-unit) * 55);
      flex-shrink: 0;
      padding: var(--ca-space-4) var(--ca-space-3);
      border-right: var(--ca-border-width) solid var(--ca-outline-subtle);
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-0-5);
      overflow-y: auto;
      overflow-x: hidden;
    }

    .ca-app-settings__nav::-webkit-scrollbar { width: 0; }

    /* Item da nav */
    .ca-app-settings__nav-item {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      padding: var(--ca-space-2) var(--ca-space-2-5);
      border-radius: var(--ca-radius-md);
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-medium);
      font-family: inherit;
      color: var(--ca-text-secondary);
      text-align: left;
      width: 100%;
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color      var(--ca-duration-fast) var(--ca-ease-standard);
      position: relative;
      line-height: var(--ca-line-height-snug);
    }

    .ca-app-settings__nav-item:hover {
      background: var(--ca-action-hover);
      color: var(--ca-text-primary);
    }

    /* Active: tinted bg + indicator pill on the left */
    .ca-app-settings__nav-item.active {
      background: color-mix(in oklab, var(--ca-brand-main) 10%, transparent);
      color: var(--ca-brand-text);
    }

    .ca-app-settings__nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: var(--ca-space-1);
      height: var(--ca-space-4);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-brand-main);
    }

    /* Danger variant */
    .ca-app-settings__nav-item.danger       { color: var(--ca-semantic-error); }
    .ca-app-settings__nav-item.danger:hover {
      background: color-mix(in oklab, var(--ca-semantic-error) 8%, transparent);
      color: var(--ca-semantic-error);
    }

    :global(.ca-app-settings__nav-icon) {
      flex-shrink: 0;
      color: currentColor;
      opacity: 0.75;
    }

    .ca-app-settings__nav-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ca-app-settings__nav-badge {
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-semibold);
      background: color-mix(in oklab, var(--ca-brand-main) 14%, transparent);
      color: var(--ca-brand-text);
      padding: var(--ca-border-width) var(--ca-space-1-5);
      border-radius: var(--ca-radius-pill);
      flex-shrink: 0;
      line-height: 1.6;
    }

    /* ── Right-hand content ───────────────────────────────────────────
       Takes ALL the remaining width, with no max-width here.
       The comfortable reading max-width lives in FormSection.
       Padding uses the global tokens.
    ─────────────────────────────────────────────────────────────── */
    .ca-app-settings__content {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--ca-space-6) var(--ca-page-px) var(--ca-space-12);
      display: flex;
      flex-direction: column;
      gap: var(--ca-page-gap);
    }

    .ca-app-settings__content::-webkit-scrollbar      { width: var(--ca-space-1-5); }
    .ca-app-settings__content::-webkit-scrollbar-track { background: transparent; }
    .ca-app-settings__content::-webkit-scrollbar-thumb {
      background: var(--ca-outline-default);
      border-radius: var(--ca-radius-pill);
    }

    /* ── Mobile (<= 768px) ───────────────────────────────────────── */
    @media (max-width: 899.98px) {
      .ca-app-settings__body { flex-direction: column; }

      /* Nav becomes a horizontal scrollable bar */
      .ca-app-settings__nav {
        width: 100%;
        flex-direction: row;
        flex-wrap: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        padding: var(--ca-space-2) var(--ca-page-px-sm);
        border-right: none;
        border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
        gap: var(--ca-space-1);
        scroll-snap-type: x proximity;
        scroll-padding-inline: var(--ca-page-px-sm);
        -webkit-overflow-scrolling: touch;
        /* Fade the trailing edge so it reads as scrollable. */
        mask-image: linear-gradient(to right, #000 calc(100% - var(--ca-page-px-sm)), transparent);
        -webkit-mask-image: linear-gradient(to right, #000 calc(100% - var(--ca-page-px-sm)), transparent);
      }

      .ca-app-settings__nav::-webkit-scrollbar { height: 0; }

      .ca-app-settings__nav-item {
        /* The base rule is width:100% (vertical list): size to content in the strip. */
        width: auto;
        min-height: var(--ca-control-height);
        white-space: nowrap;
        flex-shrink: 0;
        scroll-snap-align: start;
        padding: var(--ca-space-1-5) var(--ca-space-3);
      }

      /* Hide the indicator pill in horizontal mode: use only the bg */
      .ca-app-settings__nav-item.active::before { display: none; }

      .ca-app-settings__content {
        padding:
          var(--ca-space-4)
          var(--ca-page-px-sm)
          var(--ca-space-10);
      }

      .ca-app-settings__header {
        padding:
          var(--ca-space-4)
          var(--ca-page-px-sm)
          var(--ca-space-3);
        flex-wrap: wrap;
      }
    }
}
</style>
