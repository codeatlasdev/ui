<script lang="ts">
  import { AppShellLayout, PageShell, KpiCard, GlassCard, Grid, type NavModule } from '@codeatlasdev/ui';
  import { LayoutDashboard, Users, BarChart3, Settings, CreditCard, Activity } from '@lucide/svelte';

  const modules: NavModule[] = [
    {
      id: 'app',
      label: 'App',
      icon: LayoutDashboard,
      basePath: '/app',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
        { id: 'users', label: 'Users', icon: Users, path: '/app/users' },
        { id: 'reports', label: 'Reports', icon: BarChart3, path: '/app/reports' },
      ],
    },
    {
      id: 'account',
      label: 'Account',
      icon: Settings,
      basePath: '/account',
      items: [
        { id: 'billing', label: 'Billing', icon: CreditCard, path: '/account/billing' },
        { id: 'activity', label: 'Activity', icon: Activity, path: '/account/activity' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/account/settings' },
      ],
    },
  ];

  // The shell is router-agnostic: the app owns the URL and feeds it back in.
  let pathname = $state('/app/dashboard');

  // Panel items are plain <a href> links, exactly what a client router intercepts. With no router
  // in this demo, do the same: take over in-stage link clicks and feed the path back in.
  function intercept(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest('a[href^="/"]');
    if (!a) return;
    e.preventDefault();
    pathname = a.getAttribute('href')!;
  }

  const titles: Record<string, string> = {
    '/app/dashboard': 'Dashboard',
    '/app/users': 'Users',
    '/app/reports': 'Reports',
    '/account/billing': 'Billing',
    '/account/activity': 'Activity',
    '/account/settings': 'Settings',
  };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="stage" onclick={intercept}>
  <AppShellLayout {modules} {pathname} onNavigate={(path) => (pathname = path)} persistPanel={false} mainId={null} skipLink={false}>
    <PageShell title={titles[pathname] ?? 'Page'} description={pathname}>
      <Grid cols="repeat(auto-fill,minmax(150px,1fr))" gap={12}>
        <KpiCard title="Revenue" value="$118k" trend={23.4} />
        <KpiCard title="Users" value="24.8k" trend={8.1} />
      </Grid>
      <GlassCard full>
        <p class="hint">Click a rail icon or a panel item. The demo keeps the pathname in local state.</p>
      </GlassCard>
    </PageShell>
  </AppShellLayout>
</div>

<style>
  /* The shell sizes itself with --ca-vh and pins its sidebar and bottom nav with position: fixed.
     Overriding --ca-vh and creating a containing block (contain: layout) frames it inside the demo. */
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
    margin: 0;
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
</style>
