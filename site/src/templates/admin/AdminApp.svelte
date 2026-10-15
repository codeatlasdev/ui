<script lang="ts" module>
  export type AdminPage =
    | 'dashboard' | 'users' | 'users-new' | 'reports' | 'activity' | 'settings' | 'billing' | 'profile';
</script>

<script lang="ts">
  // Admin template island: demo auth guard + AppShellLayout + the selected page.
  import { onMount } from 'svelte';
  import { getUser, logout, type AuthUser } from '../_shared/auth';
  import TemplateShell from '../_shared/TemplateShell.svelte';
  import Activity from './Activity.svelte';
  import Billing from './Billing.svelte';
  import Dashboard from './Dashboard.svelte';
  import NewUser from './NewUser.svelte';
  import Profile from './Profile.svelte';
  import Reports from './Reports.svelte';
  import Settings from './Settings.svelte';
  import Users from './Users.svelte';

  interface Props {
    page: AdminPage;
    pathname: string;
  }
  let { page, pathname }: Props = $props();

  const SIGN_IN = '/templates/admin/sign-in/';

  // The shell chrome does not depend on the session, so it is server-rendered and painted at once.
  // Only the page body waits for the guard (demo auth lives in localStorage, client-only).
  const PENDING: AuthUser = { name: 'Account', email: '', role: 'Admin' };
  let user = $state<AuthUser | null>(null);

  onMount(() => {
    const current = getUser();
    if (!current) {
      location.replace(SIGN_IN);
      return;
    }
    user = current;
  });

  function signOut() {
    logout();
    location.assign(SIGN_IN);
  }
</script>

<TemplateShell base="/templates/admin" {pathname} user={user ?? PENDING} onSignOut={user ? signOut : undefined}>
  {#if user}
    {#if page === 'dashboard'}<Dashboard {user} />
    {:else if page === 'users'}<Users />
    {:else if page === 'users-new'}<NewUser />
    {:else if page === 'reports'}<Reports />
    {:else if page === 'activity'}<Activity />
    {:else if page === 'settings'}<Settings />
    {:else if page === 'billing'}<Billing />
    {:else if page === 'profile'}<Profile {user} />
    {/if}
  {/if}
</TemplateShell>
