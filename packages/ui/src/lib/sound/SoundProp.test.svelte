<script lang="ts">
  import Button from '../components/Button/Button.svelte';
  import Dialog from '../components/Dialog/Dialog.svelte';
  import Slider from '../components/Slider/Slider.svelte';
  import Switch from '../components/Switch/Switch.svelte';
  import Tabs from '../components/Tabs/Tabs.svelte';
  import TabsList from '../components/Tabs/TabsList.svelte';
  import TabsTrigger from '../components/Tabs/TabsTrigger.svelte';
  import type { SoundProp } from '../utils/sound-bus.js';

  let { sound }: { sound?: SoundProp } = $props();
  let open = $state(false);
  let on = $state(false);
  let tab = $state('a');
  let level = $state(50);
</script>

<Button {sound}>Press me</Button>
<Switch {sound} bind:checked={on} label="Wi-Fi" />
<Tabs {sound} bind:value={tab}>
  <TabsList>
    <TabsTrigger value="a">One</TabsTrigger>
    <TabsTrigger value="b">Two</TabsTrigger>
  </TabsList>
</Tabs>
<Slider {sound} bind:value={level} />
<Button onclick={() => (open = true)}>Open dialog</Button>
<Dialog {sound} bind:open title="Sound dialog">Body</Dialog>
