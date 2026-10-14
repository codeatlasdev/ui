<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  /**
   * AppList: fullscreen CRUD/list layout.
   *
   * ── Simple mode (data prop, recommended): ──────────────────────
   *
   *   <AppList title="Users" data={ALL} searchKeys={['name','email']} perPage={8}>
   *     {#snippet actions()}<Button href="/users/new">+ New</Button>{/snippet}
   *
   *     {#snippet filters(list)}
   *       <FilterGroup options={roleOpts} value={list.filters['role']}
   *                    onchange={v => list.setFilter('role', v)} />
   *     {/snippet}
   *
   *     {#snippet children(list)}
   *       <SimpleTable>
   *         <thead><tr><th>Name</th><th>Role</th></tr></thead>
   *         <tbody>
   *           {#each list.rows as u (u.id)}
   *             <tr><td>{u.name}</td><td>{u.role}</td></tr>
   *           {/each}
   *         </tbody>
   *       </SimpleTable>
   *     {/snippet}
   *   </AppList>
   *
   * ── Manual mode (no data prop, compatibility): ───────────────
   *
   *   <AppList title="Users" description="24 of 240">
   *     {#snippet toolbar()}<TextField bind:value={search} />{/snippet}
   *     <SimpleTable>…</SimpleTable>
   *     {#snippet footer()}
   *       <span class="ca-page-info">1–8 of 24</span>
   *       <Pagination count={240} perPage={8} bind:page />
   *     {/snippet}
   *   </AppList>
   */
  import type { Snippet } from 'svelte';
  import { useListState } from '../../utils/use-list-state.svelte.js';
  import type { UseListStateReturn } from '../../utils/use-list-state.svelte.js';
  import TextField from '../TextField/TextField.svelte';
  import Pagination from '../Pagination/Pagination.svelte';
  import { Search } from '@lucide/svelte';
  const t = useT();

  type ListCtx<T> = UseListStateReturn<T>;

  interface Props<T extends Record<string, any> = Record<string, any>> {
    title?:       string;
    description?: string;

    // ── Data-driven mode ──────────────────────────────────────────
    /** Full dataset. When provided, AppList manages search/filter/pagination internally. */
    data?:        T[];
    /** Fields to include in text search. Default: all string fields. */
    searchKeys?:  (keyof T)[];
    /** Rows per page. Default: 20. */
    perPage?:     number;
    /** Row identifier field. Default: 'id'. */
    idKey?:       keyof T;
    /** Placeholder for the auto-rendered search input. Default: 'Search…' */
    searchPlaceholder?: string;
    /** Word between the numbers in the auto count and page info ("8 of 24"). Default: 'of'; use 'de' in pt-BR. */
    ofLabel?: string;

    // ── Snippets (data mode, receive list context) ───────────────
    /** Extra filter controls rendered after the search input. Receives list context. */
    filters?:     Snippet<[ListCtx<T>]>;
    /** Table/grid content. Receives list context when `data` is provided. */
    children?:    Snippet<[ListCtx<T>]> | Snippet;

    // ── Snippets (always available) ───────────────────────────────
    /** Top-right: primary CTA, export, etc. */
    actions?:     Snippet;
    /** Manual toolbar, only used when `data` is NOT provided. */
    toolbar?:     Snippet;
    /** Empty state shown when filtered rows = 0. Receives list context. */
    empty?:       Snippet<[ListCtx<T>]> | Snippet;
    /** Manual footer, only used when `data` is NOT provided. */
    footer?:      Snippet;

    maxWidth?:    string;
    class?:       string;
  }

  let {
    title,
    description,
    data,
    searchKeys,
    perPage      = 20,
    idKey,
    searchPlaceholder,
    ofLabel,
    filters,
    actions,
    toolbar,
    empty,
    footer,
    children,
    maxWidth,
    class: className = '',
  }: Props = $props();

  // Internal list state, only active when `data` prop is provided
  const list = $derived(
    data
      ? useListState({ data, perPage, searchKeys, idKey, ofLabel })
      : null,
  );

  // Description auto-derived from list state when not provided manually
  const desc = $derived(
    description ?? (list ? list.count : undefined),
  );
</script>

<div class="ca-app-list {className}" style={maxWidth ? `--al-max:${maxWidth}` : undefined}>

  <!-- Header -->
  {#if title || desc || actions}
    <div class="ca-app-list__header">
      <div class="ca-app-list__meta">
        {#if title}<h1 class="ca-app-list__title ca-sr-only--shell">{title}</h1>{/if}
        {#if desc}<p class="ca-app-list__desc">{desc}</p>{/if}
      </div>
      {#if actions}
        <div class="ca-app-list__actions">{@render actions()}</div>
      {/if}
    </div>
  {/if}

  <!-- Toolbar -->
  {#if list}
    <!-- Data mode: auto search + filters snippet -->
    <div class="ca-app-list__toolbar">
      <TextField
        placeholder={searchPlaceholder ?? t().appList.searchPlaceholder}
        bind:value={list.search}
        class="ca-search-field"
        size="sm"
      >
        {#snippet leading()}<Search size={13} />{/snippet}
      </TextField>

      {#if filters}
        <div class="ca-app-list__toolbar-sep"></div>
        {@render (filters as Snippet<[ListCtx<any>]>)(list)}
      {/if}

      {#if list.hasFilters}
        <button
          type="button"
          class="ca-app-list__clear"
          onclick={() => list!.clearFilters()}
        >
          {t().appList.clear}
        </button>
      {/if}

      <div class="ca-app-list__spacer"></div>

      {#if list.selected.size > 0}
        <span class="ca-app-list__sel-label">{t().appList.selected(list.selected.size)}</span>
      {/if}
    </div>
  {:else if toolbar}
    <!-- Manual mode: pass-through toolbar snippet -->
    <div class="ca-app-list__toolbar">{@render toolbar()}</div>
  {/if}

  <!-- Body -->
  <!-- Scrollable region: keyboard-focusable on purpose (axe scrollable-region-focusable). -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="ca-app-list__body" tabindex="0" role="region" aria-label={t().appList.listContent}>
    {#if list}
      {#if list.rows.length === 0}
        <div class="ca-app-list__empty">
          {#if empty}
            {@render (empty as Snippet<[ListCtx<any>]>)(list)}
          {:else}
            <p class="ca-app-list__empty-msg">{t().appList.empty}</p>
          {/if}
        </div>
      {:else if children}
        {@render (children as Snippet<[ListCtx<any>]>)(list)}
      {/if}
    {:else if children}
      {@render (children as Snippet)()}
    {:else if empty}
      <div class="ca-app-list__empty">{@render (empty as Snippet)()}</div>
    {/if}
  </div>

  <!-- Footer -->
  {#if list}
    <!-- Data mode: auto pagination -->
    <div class="ca-app-list__footer">
      <span class="ca-page-info">{list.pageInfo}</span>
      <Pagination
        count={list.filtered.length}
        {perPage}
        bind:page={list.page}
        siblingCount={1}
      />
    </div>
  {:else if footer}
    <!-- Manual mode: pass-through footer snippet -->
    <div class="ca-app-list__footer">{@render footer()}</div>
  {/if}

</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-app-list {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      width: 100%;
      max-width: var(--al-max, none);
      margin: 0 auto;
    }

    .ca-app-list__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-4);
      padding:
        var(--ca-page-pt)
        var(--ca-page-px)
        var(--ca-space-3);
      flex-shrink: 0;
    }

    .ca-app-list__meta { flex: 1; min-width: 0; }

    .ca-app-list__title {
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-h5);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      margin: 0 0 var(--ca-space-0-5);
      line-height: var(--ca-line-height-tight);
    }

    .ca-app-list__desc {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      margin: 0;
      line-height: var(--ca-line-height-snug);
    }

    .ca-app-list__actions {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      flex-shrink: 0;
    }

    .ca-app-list__toolbar {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      padding: var(--ca-space-2) var(--ca-page-px);
      flex-shrink: 0;
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
      overflow-x: auto;
      overflow-y: hidden;
    }

    .ca-app-list__toolbar::-webkit-scrollbar { height: 0; }

    .ca-app-list__toolbar-sep {
      width: var(--ca-border-width);
      height: var(--ca-space-5);
      background: var(--ca-outline-subtle);
      flex-shrink: 0;
    }

    .ca-app-list__spacer { flex: 1; }

    .ca-app-list__clear {
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-hint);
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--ca-space-0-5) var(--ca-space-1);
      border-radius: var(--ca-radius-sm);
      font-family: inherit;
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
      flex-shrink: 0;
    }
    .ca-app-list__clear:hover { color: var(--ca-text-primary); }

    .ca-app-list__sel-label {
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-brand-text);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .ca-app-list__body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: auto;
    }

    .ca-app-list__body::-webkit-scrollbar      { width: var(--ca-space-1-5); height: var(--ca-space-1-5); }
    .ca-app-list__body::-webkit-scrollbar-track { background: transparent; }
    .ca-app-list__body::-webkit-scrollbar-thumb {
      background: var(--ca-outline-default);
      border-radius: var(--ca-radius-pill);
    }

    .ca-app-list__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: calc(var(--ca-space-unit) * 70);
    }

    .ca-app-list__empty-msg {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-hint);
      margin: 0;
    }

    .ca-app-list__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-3);
      padding: var(--ca-space-3) var(--ca-page-px);
      flex-shrink: 0;
      border-top: var(--ca-border-width) solid var(--ca-outline-subtle);
    }

    @media (max-width: 599.98px) {
      /* Title and actions share one row (actions never float alone on a line); they only wrap
         when the title genuinely cannot fit, and then the actions start the new line. */
      .ca-app-list__header {
        flex-wrap: wrap;
        row-gap: var(--ca-space-3);
        padding:
          var(--ca-space-4)
          var(--ca-page-px-sm)
          var(--ca-space-3);
      }
      .ca-app-list__toolbar { padding: var(--ca-space-2) var(--ca-page-px-sm); }
      /* Cards align with the header and toolbar edges instead of touching the screen. */
      .ca-app-list__body { padding: var(--ca-space-1) var(--ca-page-px-sm) var(--ca-space-3); }
      /* The search field takes the free width instead of its fixed min-width. */
      .ca-app-list__toolbar :global(.ca-search-field) { flex: 1 1 auto; min-width: 0; max-width: none; }
      .ca-app-list__footer  { padding: var(--ca-space-2) var(--ca-page-px-sm); flex-wrap: wrap; }
    }
}
</style>
