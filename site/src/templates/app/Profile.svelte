<script lang="ts">
  import ProfileScreen from '../_shared/ProfileScreen.svelte';
</script>

<ProfileScreen
  initial={{ name: 'Ana Lima', email: 'ana@acme.com' }}
  saveDelay={1200}
  copy={{
    profileDescription: 'How you appear in the platform.',
    nameLabel: 'Full name',
    timezoneLabel: 'Timezone',
    bioPlaceholder: 'Tell us about yourself',
    notificationsDescription: "Choose what you're notified about.",
  }}
/>
