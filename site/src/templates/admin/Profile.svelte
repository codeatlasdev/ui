<script lang="ts">
  import ProfileScreen from '../_shared/ProfileScreen.svelte';

  let { user }: { user: { name: string; email: string; role: string } | null } = $props();
</script>

<ProfileScreen
  {user}
  saveDelay={1000}
  copy={{
    profileDescription: 'How you appear on the platform.',
    nameLabel: 'Name',
    timezoneLabel: 'Time zone',
    notificationsDescription: 'Choose what you want to be notified about.',
  }}
/>
