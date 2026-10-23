<script lang="ts">
  import type { Snippet } from 'svelte';
  import { scrollFocusable } from '../../actions/scroll-focusable.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { pageShell } from '../../i18n/groups/pageShell.js';
  import { provideSectionHeadingLevel } from './heading-context.js';
  const t = useMessages(pageShell);

  interface Props {
    title?: string;
    description?: string;
    gap?: number;
    maxWidth?: string;
    /**
     * Caps the content column. `reading` is ~46rem (forms, settings: readable line length, inputs
     * that do not stretch edge to edge); `wide` (default) uses the full shell width. With an
     * `aside` the cap applies to the content column and the aside sits next to it.
     */
    width?: 'reading' | 'wide';
    actions?: Snippet;
    /**
     * Companion column (in-page index, summary, help, preview). Next to the content (sticky) when
     * the shell is wide enough, after the content below that. Rendered as `<aside>`.
     */
    aside?: Snippet;
    /** Accessible name of the `<aside>` landmark. Defaults to "Page sidebar" (localized). */
    asideLabel?: string;
    class?: string;
    children?: Snippet;
  }

  let { title, description, gap, maxWidth, width = 'wide', actions, aside, asideLabel, class: className = '', children }: Props = $props();
  const titleId = $props.id();
  // The page <h1> is rendered above; titles inside the shell default to <h2>.
  provideSectionHeadingLevel();

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
          <h1 class="ca-page-shell__title ca-sr-only--shell" id={titleId}>{title}</h1>
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
  <div class="ca-page-shell__frame">
    <div class="ca-page-shell__layout" class:ca-page-shell__layout--reading={width === 'reading'} class:ca-page-shell__layout--aside={!!aside}>
      <div class="ca-page-shell__main ca-page-shell__body">
        {@render children?.()}
      </div>
      {#if aside}
        <aside class="ca-page-shell__aside" aria-label={asideLabel ?? t().pageShell.aside}>
          {@render aside()}
        </aside>
      {/if}
    </div>
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

    /* The frame is the container: the aside moves beside the content when the SHELL is wide
       (it shares the viewport with the rail and panel), not when the viewport is. */
    .ca-page-shell__frame { container-type: inline-size; }

    .ca-page-shell__layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--ps-gap, var(--ca-space-7));
      align-items: start;
    }

    .ca-page-shell__layout--reading { grid-template-columns: minmax(0, var(--ca-reading-width, 46rem)); justify-content: center; }

    .ca-page-shell__aside {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-4);
    }

    @container (min-width: 60rem) {
      .ca-page-shell__layout--aside {
        grid-template-columns: minmax(0, 1fr) var(--ca-aside-width, 17rem);
      }
      .ca-page-shell__layout--aside.ca-page-shell__layout--reading {
        grid-template-columns: minmax(0, var(--ca-reading-width, 46rem)) var(--ca-aside-width, 17rem);
      }
      .ca-page-shell__aside {
        position: sticky;
        top: 0;
      }
    }

    @media (max-width: 599.98px) {
      .ca-page-shell {
        padding: var(--ca-space-5) var(--ca-page-px-sm) var(--ca-space-10);
      }
    }

    /* Mobile: description leads, actions wrap below it. Labeled buttons share the row
       full-width (big tap targets); everything else (icon controls, StatusChip, Chip,
       Badge, text) keeps its natural size and stays at the end, so a lone
       ThemeToggle/IconButton/StatusChip never stretches or centres. */
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
      .ca-page-shell__actions > :global(.ca-btn) {
        flex: 1 1 auto;
      }
      /* .ca-rail-btn is width:100% by default (rail slot); here it is an icon control. */
      .ca-page-shell__actions > :global(.ca-rail-btn) {
        width: auto;
      }
    }
}
</style>
