<script lang="ts">
  import DashboardScreen from '../_shared/DashboardScreen.svelte';

  let { user }: { user: { name: string } | null } = $props();
</script>

<DashboardScreen
  title="Good morning, {user?.name?.split(' ')[0] ?? 'there'}"
  usersHref="/templates/admin/users/"
  uptimeTitle="Uptime"
  pieCenterLabel="Channels"
/>
