<script lang="ts">
  import { Button, Dialog, Slider, Switch, Tabs, TabsList, TabsTrigger, toast } from '@codeatlasdev/ui';
  import { SoundToggle } from '@codeatlasdev/ui/sound';

  let on = $state(false);
  let level = $state(40);
  let tab = $state('a');
  let open = $state(false);
</script>

<div class="comp">
  <SoundToggle />
  <Button sound>Save</Button>
  <Switch sound bind:checked={on} label="Notifications" />
  <Tabs sound bind:value={tab}>
    <TabsList>
      <TabsTrigger value="a">Overview</TabsTrigger>
      <TabsTrigger value="b">Activity</TabsTrigger>
    </TabsList>
  </Tabs>
  <Slider sound bind:value={level} />
  <Button variant="outlined" onclick={() => toast.success('Saved', { sound: true })}>Toast</Button>
  <Button variant="outlined" onclick={() => (open = true)}>Dialog</Button>
  <Dialog sound bind:open title="Sound on open and close">Every cue also has a visible change.</Dialog>
</div>

<style>
  .comp { display: grid; justify-items: start; gap: var(--ca-space-4); }
</style>
