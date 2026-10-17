<script lang="ts">
  import { AppShellLayout, PageShell, Card, type NavModule } from '@codeatlasdev/ui';
  import { Folder } from '@lucide/svelte';

  const modules: NavModule[] = [
    {
      id: 'projects',
      label: 'Projects',
      icon: Folder,
      basePath: '/projects',
      items: [
        { id: 'a', label: 'Quarterly revenue forecast and planning', icon: Folder, path: '/projects/revenue' },
        { id: 'b', label: 'Customer onboarding experience redesign', icon: Folder, path: '/projects/onboarding' },
        { id: 'c', label: 'Infrastructure cost review', icon: Folder, path: '/projects/infra' },
      ],
    },
    { id: 'other', label: 'Other', icon: Folder, basePath: '/other', items: [] },
  ];

  let pathname = $state('/projects/revenue');

  function intercept(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest('a[href^="/"]');
    if (!a) return;
    e.preventDefault();
    pathname = a.getAttribute('href')!;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="stage" onclick={intercept}>
  <AppShellLayout {modules} {pathname} panelWidth={280} resizablePanel persistPanel={false} mainId={null} skipLink={false}>
    <PageShell title="Wider panel" description="Drag the panel edge, or focus it and use the arrow keys.">
      <Card material="glass" full>
        <p class="hint">The panel starts at 280px and holds between 160px and 480px.</p>
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
