<script lang="ts">
  import {
    AppShellLayout,
    DropdownMenuItem,
    NavItemMenu,
    NavReorder,
    PageShell,
    Card,
    type NavModule,
    type NavReorderEvent,
  } from '@codeatlasdev/ui';
  import { Folder } from '@lucide/svelte';

  type Row = { id: string; name: string; color: string; count: number };
  let rows = $state<Row[]>([
    { id: 'design', name: 'Design system', color: '#e11d48', count: 42 },
    { id: 'web', name: 'Marketing site', color: '#2563eb', count: 1280 },
    { id: 'mobile', name: 'Mobile app', color: '#16a34a', count: 0 },
  ]);
  let log = $state('Open the … menu of a row, or drag a row by its grip.');

  function reorder(e: NavReorderEvent) {
    const next = rows.slice();
    const [moved] = next.splice(e.from, 1);
    next.splice(e.to, 0, moved);
    rows = next;
    log = `Moved ${moved.name} to position ${e.to + 1}.`;
  }

  const modules: NavModule[] = $derived([
    {
      id: 'projects',
      label: 'Projects',
      icon: Folder,
      basePath: '/projects',
      items: [
        {
          label: 'Workspaces',
          collapsible: false,
          onReorder: reorder,
          items: rows.map((r) => ({
            id: r.id,
            label: r.name,
            icon: Folder,
            path: `/projects/${r.id}`,
            color: r.color,
            count: r.count,
            actions: menu,
          })),
        },
      ],
    },
    { id: 'other', label: 'Other', icon: Folder, basePath: '/other', items: [] },
  ]);

  let pathname = $state('/projects/design');
  function intercept(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest('a[href^="/"]');
    if (!a) return;
    e.preventDefault();
    pathname = a.getAttribute('href')!;
  }
</script>

{#snippet menu()}
  <DropdownMenuItem onclick={() => (log = 'Favorite')}>{#snippet children()}Favorite{/snippet}</DropdownMenuItem>
  <DropdownMenuItem onclick={() => (log = 'Archive')} variant="destructive">{#snippet children()}Archive{/snippet}</DropdownMenuItem>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="stage" onclick={intercept}>
  <AppShellLayout {modules} {pathname} reorder={NavReorder} itemMenu={NavItemMenu} persistPanel={false} mainId={null} skipLink={false}>
    <PageShell title="Workspaces" description={pathname}>
      <Card material="glass" full>
        <p class="hint">{log}</p>
      </Card>
    </PageShell>
  </AppShellLayout>
</div>

<style>
  .stage {
    --ca-vh: 360px;
    position: relative;
    width: 100%;
    height: 360px;
    contain: layout paint;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
  }
  .hint {
    margin: 0;
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
</style>
