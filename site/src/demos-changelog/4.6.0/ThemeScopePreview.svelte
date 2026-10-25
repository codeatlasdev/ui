<script lang="ts">
  import { Button, Card, PreviewStage, Switch, TextField } from '@codeatlasdev/ui';

  // 'fill' is the component's default: the frame is as wide as the stage, so on a phone it is never scaled down
  // (a scaled frame draws every control smaller than it is). Pick 390, 768 or 1280 to see the other widths.
  let width = $state<number | 'fill'>('fill');
  let name = $state('Acme Inc.');
  let updates = $state(true);
</script>

<PreviewStage label="Workspace settings form" bind:width scheme="light" preset="ocean" height={380}>
  <Card title="Workspace" headingLevel={3} gap="md">
    <TextField label="Workspace name" bind:value={name} />
    <Switch bind:checked={updates} label="Email me about releases" />
    <Button>Save changes</Button>
  </Card>
</PreviewStage>
