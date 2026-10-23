<script lang="ts">
  import { AppShellLayout, PageShell, Card, type NavModule } from '@codeatlasdev/ui';
  import { Settings, User, CreditCard } from '@lucide/svelte';

  const modules: NavModule[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      basePath: '/settings',
      items: [
        { id: 'profile', label: 'Profile', icon: User, path: '/settings/profile' },
        { id: 'billing', label: 'Billing', icon: CreditCard, path: '/settings/billing' },
      ],
    },
  ];

  let pathname = $state('/settings/profile');

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
  <AppShellLayout {modules} {pathname} collapseShortPanel persistPanel={false} mainId={null} skipLink={false}>
    <PageShell title="Profile" description="A two-item module needs no panel: the rail is enough.">
      <Card material="glass" full>
        <p class="hint">With collapseShortPanel the content takes the width a two-link panel would waste.</p>
      </Card>
    </PageShell>
  </AppShellLayout>
</div>

<style>
  .stage {
    --ca-vh: 320px;
    position: relative;
    width: 100%;
    height: 320px;
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
