<script lang="ts">
  import type { Snippet } from 'svelte';
  import { scrollFocusable } from '../../actions/scroll-focusable.js';

  interface Props {
    title?: string;
    description?: string;
    gap?: number;
    maxWidth?: string;
    actions?: Snippet;
    class?: string;
    children?: Snippet;
  }

  let { title, description, gap, maxWidth, actions, class: className = '', children }: Props = $props();
  const titleId = $props.id();

  // Only caller-supplied values become inline vars; the defaults live in the stylesheet as tokens.
  const rootStyle = $derived(
    [maxWidth ? `--ps-max:${maxWidth}` : '', gap !== undefined ? `--ps-gap:${gap}px` : ''].filter(Boolean).join(';') || undefined,
  );
</script>

<!-- The shell is the page's scroll container, named by its title. Focusable in the server
     HTML too (keyboard scrolling before or without hydration); scrollFocusable drops the tab
     stop after hydration when nothing overflows (axe scrollable-region-focusable). -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="ca-page-shell {className}"
  style={rootStyle}
  role="region"
  aria-labelledby={title ? titleId : undefined}
  tabindex="0"
  use:scrollFocusable
>
  {#if title || description || actions}
    <div class="ca-page-shell__header">
      <div class="ca-page-shell__meta">
        {#if title}
          <h1 class="ca-page-shell__title" id={titleId}>{title}</h1>
        {/if}
        {#if description}
          <p class="ca-page-shell__description">{description}</p>
        {/if}
      </div>
      {#if actions}
        <div class="ca-page-shell__actions">
          {@render actions()}
        </div>
      {/if}
    </div>
  {/if}
  <div class="ca-page-shell__body">
    {@render children?.()}
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-page-shell {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      max-width: var(--ps-max, calc(var(--ca-space-unit) * 320));
      width: 100%;
      margin: 0 auto;
      padding: var(--ca-page-pt) var(--ca-page-px) var(--ca-space-12);
      box-sizing: border-box;
    }

    .ca-page-shell__header {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--ca-space-4);
      margin-bottom: var(--ps-gap, var(--ca-space-7));
    }

    .ca-page-shell__meta { flex: 1; min-width: 0; }

    .ca-page-shell__title {
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-h5);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      margin: 0 0 var(--ca-space-0-5);
      line-height: var(--ca-line-height-tight);
    }

    .ca-page-shell__description {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      margin: 0;
      line-height: var(--ca-line-height-relaxed);
    }

    .ca-page-shell__actions {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      flex-shrink: 0;
    }

    .ca-page-shell__body {
      display: flex;
      flex-direction: column;
      gap: var(--ps-gap, var(--ca-space-7));
      width: 100%;
    }

    @media (max-width: 599.98px) {
      .ca-page-shell {
        padding: var(--ca-space-5) var(--ca-page-px-sm) var(--ca-space-10);
      }
    }

    /* Inside AppShellLayout the mobile header (< 900px) already shows the page title:
       keep the h1 for assistive tech and the document outline, hide it visually. */
    @media (max-width: 899.98px) {
      :global(.ca-shell__content) .ca-page-shell__title {
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

    /* Mobile: description leads, actions wrap below it. Labeled controls share the row
       full-width (big tap targets); icon-only controls keep their natural size and stay
       at the end, so a lone ThemeToggle/IconButton never stretches or centres. */
    @media (max-width: 899.98px) {
      .ca-page-shell__header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--ca-space-3);
      }
      .ca-page-shell__actions {
        flex-shrink: 1;
        flex-wrap: wrap;
        justify-content: flex-end;
        width: 100%;
      }
      .ca-page-shell__actions > :global(*) {
        flex: 1 1 auto;
      }
      .ca-page-shell__actions > :global(.ca-icon-btn),
      .ca-page-shell__actions > :global(.ca-rail-btn) {
        flex: 0 0 auto;
        width: auto;
      }
    }
}
</style>
