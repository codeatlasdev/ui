<script lang="ts">
  import { Button, Card, PreviewStage, Switch, TextField } from '@codeatlasdev/ui';

  let width = $state<number | 'fill'>(390);
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
