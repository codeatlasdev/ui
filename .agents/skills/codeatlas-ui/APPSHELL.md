# AppShell

Full navigation shell: side rail (icon dock) + collapsible panel + main area.

## Rules

- Put `AppShellLayout` only in authenticated-area route layouts (e.g. `src/routes/painel/+layout.svelte`).
- Never in the root `+layout.svelte`.
- Never import `$app/stores` inside the package. Pass `pathname` and `onNavigate` from the app.

## NavModule shape

```ts
import type { NavModule } from '@codeatlasdev/ui';
import { LayoutDashboard, Users, Settings } from '@lucide/svelte';

const MODULES: NavModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/painel',
    sections: [], // no sub-nav
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    path: '/painel/users',
    sections: [
      {
        id: 'users-main',
        label: '',
        items: [
          { id: 'all-users', label: 'All users', path: '/painel/users' },
          { id: 'roles', label: 'Roles', path: '/painel/users/roles' },
        ],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/painel/settings',
    sections: [],
  },
];
```

## Layout file

```svelte
<!-- src/routes/painel/+layout.svelte -->
<script>
  import { AppShellLayout, NotificationBell, Avatar } from '@codeatlasdev/ui';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { MODULES } from '$lib/nav';

  let { children } = $props();
  let notifications = $state([]);
</script>

<AppShellLayout
  modules={MODULES}
  pathname={$page.url.pathname}
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
