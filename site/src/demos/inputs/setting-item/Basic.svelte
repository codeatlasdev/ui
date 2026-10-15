<script lang="ts">
  import { SettingItem, Switch } from '@codeatlasdev/ui';

  let email = $state(true);
  let digest = $state(false);
</script>

<SettingItem label="Email notifications" description="Receive an email for every mention.">
  <Switch bind:checked={email} />
</SettingItem>
<SettingItem label="Weekly digest" description="One summary every Monday.">
  <Switch bind:checked={digest} />
</SettingItem>
