<script lang="ts">
  import NewUserScreen from '../_shared/NewUserScreen.svelte';
</script>

<NewUserScreen
  usersHref="/templates/app/users/"
  saveDelay={1200}
  notificationsDescription="Email alerts for this user."
  notificationsLayout="list"
  cancelVariant="ghost"
/>
