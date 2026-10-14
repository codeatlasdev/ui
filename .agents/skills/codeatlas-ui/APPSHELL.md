# AppShell

Full navigation shell: side rail (icon dock) + collapsible panel + main area.

## Rules

- Put `AppShellLayout` only in authenticated-area route layouts (e.g. `src/routes/painel/+layout.svelte`).
- Never in the root `+layout.svelte`.
- Never import `$app/state` or `$app/navigation` inside the package. Pass `pathname` and `onNavigate` from the app.

## NavModule shape

A module is one icon in the Rail. `basePath` (plus optional `pathPrefixes`) decides which module is active for the current URL; `items` fills the Panel and is a mix of `NavItem` (a link) and `NavSection` (a labelled, optionally collapsible group of links). Every `NavItem` needs an `icon` and a `path`. A module with `items: []` has no panel: the Rail click goes to `basePath`.

```ts
import type { NavModule } from '@codeatlasdev/ui';
import { LayoutDashboard, Users, Shield, Settings } from '@lucide/svelte';

const MODULES: NavModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    basePath: '/painel',
    items: [], // no sub-nav
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    basePath: '/painel/users',
    pathPrefixes: ['/painel/invites'], // extra URLs that also activate this module
    items: [
      { id: 'all-users', label: 'All users', icon: Users, path: '/painel/users' },
      {
        label: 'Access', // NavSection: label and collapsible are optional
        collapsible: true,
        items: [{ id: 'roles', label: 'Roles', icon: Shield, path: '/painel/users/roles' }],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    basePath: '/painel/settings',
    items: [],
  },
];
```

Item extras: `badge` (number), `isNew`, `shortcut`, `description`.

## Layout file

```svelte
<!-- src/routes/painel/+layout.svelte -->
<script>
  import { AppShellLayout, NotificationBell, Avatar } from '@codeatlasdev/ui';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { MODULES } from '$lib/nav'; // Kit 3: '#lib/nav.ts' (see SKILL.md, SvelteKit 3)

  let { children } = $props();
  let notifications = $state([]);
</script>

<AppShellLayout
  modules={MODULES}
  pathname={page.url.pathname}
  onNavigate={path => goto(path)}
  persistPanel={true}
>
  {#snippet brand()}
    <a href="/" aria-label="Acme"><AcmeLogo size={28} /></a>
  {/snippet}
  {#snippet railBottom()}
    <NotificationBell {notifications} onRead={id => markRead(id)} />
    <a href="/painel/profile" class="ca-rail-avatar">
      <Avatar alt="User" size="sm" />
    </a>
  {/snippet}

  {@render children()}
</AppShellLayout>
```

## Props

| Prop | Type | Default |
|---|---|---|
| `modules` | `NavModule[]` | required |
| `pathname` | `string` | required |
| `onNavigate` | `(path: string) => void` | required |
| `persistPanel` | `boolean` | `true` |

## Anti-patterns

```svelte
<!-- ✗ Never: AppShell in root layout -->
<!-- src/routes/+layout.svelte -->
<AppShellLayout ...>  <!-- WRONG: applies to all routes including /login -->

<!-- ✓ Correct: AppShell only in authenticated section -->
<!-- src/routes/painel/+layout.svelte -->
<AppShellLayout ...>
```
