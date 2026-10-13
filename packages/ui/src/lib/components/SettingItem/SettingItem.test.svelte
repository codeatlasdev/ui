<script lang="ts">
  import Switch from '../Switch/Switch.svelte';
  import SettingItem from './SettingItem.svelte';

  let {
    label = 'Notifications',
    description,
    checked = $bindable(false),
  }: { label?: string; description?: string; checked?: boolean } = $props();
</script>

<SettingItem {label} {description}>
  <Switch bind:checked />
</SettingItem>
