<script lang="ts">
  import NewUserScreen from '../_shared/NewUserScreen.svelte';
</script>

<NewUserScreen
  usersHref="/templates/admin/users/"
  saveDelay={1000}
  notificationsDescription="Communication settings."
  cancelVariant="outlined"
/>
