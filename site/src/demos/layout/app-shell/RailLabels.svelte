<script lang="ts">
  import { AppShellLayout, Button, PageShell, Card, type NavModule } from '@codeatlasdev/ui';
  import { Bell, Inbox, Map as MapIcon, Search, Settings, Users, Home } from '@lucide/svelte';

  // Role filter: the same list for everyone, filtered on the way in.
  let admin = $state(true);

  const modules: NavModule[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, basePath: '/inbox', badge: 12, items: [
      { id: 'all', label: 'All', icon: Inbox, path: '/inbox/all' },
      { id: 'sent', label: 'Sent', icon: Inbox, path: '/inbox/sent' },
    ] },
    { id: 'map', label: 'Map', icon: MapIcon, basePath: '/map', badge: 'dot', badgeLabel: 'Search running', items: [
      { id: 'live', label: 'Live', icon: MapIcon, path: '/map/live' },
      { id: 'saved', label: 'Saved', icon: MapIcon, path: '/map/saved' },
    ] },
    { id: 'people', label: 'People', icon: Users, basePath: '/people', badge: 3, badgeLabel: '3 tasks pending', items: [
      { id: 'dir', label: 'Directory', icon: Users, path: '/people/dir' },
    ] },
    { id: 'alerts', label: 'Alerts', icon: Bell, basePath: '/alerts', items: [
      { id: 'rules', label: 'Rules', icon: Bell, path: '/alerts/rules' },
    ] },
    { id: 'search', label: 'Search', icon: Search, basePath: '/search', items: [
      { id: 'saved', label: 'Saved', icon: Search, path: '/search/saved' },
    ] },
    { id: 'home', label: 'Home', icon: Home, basePath: '/home', items: [
      { id: 'start', label: 'Start', icon: Home, path: '/home/start' },
    ] },
    { id: 'settings', label: 'Settings', icon: Settings, basePath: '/settings', items: [
      { id: 'gen', label: 'General', icon: Settings, path: '/settings/gen' },
    ] },
  ];

  let pathname = $state('/inbox/all');

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
  <AppShellLayout {modules} filterModules={(m) => admin || m.id !== 'settings'} {pathname} onNavigate={(path) => (pathname = path)} railLabels persistPanel={false} mainId={null} skipLink={false}>
    {#snippet railTop()}
      <Button variant="ghost" size="sm" aria-label="Search, command K">
        {#snippet leading()}<Search size={16} />{/snippet}
      </Button>
    {/snippet}
    {#snippet bottomNavOverflow()}
      <Button variant="outlined" fullWidth>Account</Button>
    {/snippet}
    <PageShell title="Labeled rail" description={pathname}>
      <Card material="glass" full>
        <p class="hint">Captions under the icons, a search trigger on top, badges with names, and a More sheet below 900px. The role filter hides Settings.</p>
        <Button variant="outlined" onclick={() => (admin = !admin)}>{admin ? 'Hide Settings (member)' : 'Show Settings (admin)'}</Button>
      </Card>
    </PageShell>
  </AppShellLayout>
</div>

<style>
  .stage {
    --ca-vh: 440px;
    position: relative;
    width: 100%;
    height: 440px;
    contain: layout paint;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
  }
  .hint {
    margin: 0 0 var(--ca-space-3);
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
</style>
