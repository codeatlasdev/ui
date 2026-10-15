<script lang="ts">
  // Shared chrome for the admin and app templates: AppShellLayout + rail actions + ⌘K palette.
  import {
    AppShellLayout, Avatar, CommandPalette, NotificationBell, Toaster,
  } from '@codeatlasdev/ui';
  import type { NotificationItem } from '@codeatlasdev/ui';
  import { ArrowLeft, LogOut, Search } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { appModules } from './modules';

  interface Props {
    /** Route prefix, e.g. "/templates/admin". */
    base: string;
    pathname: string;
    /** Adds the Products page to the nav (only the app template has one). */
    products?: boolean;
    user: { name: string; role: string };
    /** Shows a sign-out button in the rail when provided. */
    onSignOut?: () => void;
    children: Snippet;
  }
  let { base, pathname, products = false, user, onSignOut, children }: Props = $props();

  // Item paths keep their trailing slash: Astro's pathname always has one and static hosting needs it.
  const modules = $derived(appModules(base, { products }));
  const go = (path: string) => location.assign(path);

  let cmdOpen = $state(false);
  let notifications = $state<NotificationItem[]>([
    { id: '1', title: 'New user signed up',   body: 'Hana Park joined the Pro plan.',  time: '2 min ago', read: false, variant: 'success' },
    { id: '2', title: 'Monthly report ready', body: 'September revenue is available.', time: '1 hr ago',  read: false, variant: 'info'    },
    { id: '3', title: 'Disk at 82%',          body: 'Consider upgrading your plan.',   time: '3 hr ago',  read: false, variant: 'warning' },
    { id: '4', title: 'Deployment succeeded', body: 'v2.4.1 is live on production.',   time: 'Yesterday', read: true,  variant: 'default' },
  ]);

  const handleRead    = (id: string) => (notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const handleReadAll = () => (notifications = notifications.map((n) => ({ ...n, read: true })));
  const handleClear   = () => (notifications = notifications.filter((n) => n.read));
</script>

<AppShellLayout {modules} {pathname} onNavigate={go} mainId={null}>
  {#snippet railBottom()}
    <a href="/templates/" class="ca-rail-btn" aria-label="Back to templates" title="Back to templates">
      <ArrowLeft size={16} stroke-width={1.6} />
    </a>
    <button type="button" class="ca-rail-btn" aria-label="Search (⌘K)" title="Search" onclick={() => (cmdOpen = true)}>
      <Search size={16} stroke-width={1.6} />
    </button>
    <NotificationBell {notifications} onRead={handleRead} onReadAll={handleReadAll} onClear={handleClear} />
    {#if onSignOut}
      <button type="button" class="ca-rail-btn ca-rail-btn--danger" aria-label="Sign out" title="Sign out" onclick={onSignOut}>
        <LogOut size={16} stroke-width={1.6} />
      </button>
    {/if}
    <a href="{base}/profile/" class="ca-rail-avatar" aria-label="My profile: {user.name}" title="{user.name} · {user.role}">
      <Avatar alt={user.name} size="sm" />
    </a>
  {/snippet}

  <main id="main" class="app-main" tabindex="-1">{@render children()}</main>
</AppShellLayout>

<CommandPalette {modules} bind:open={cmdOpen} onNavigate={go} />
<Toaster />

<style>
  .app-main { display: contents; }
</style>
