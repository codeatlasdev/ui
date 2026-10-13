<script lang="ts">
  import Tabs from './Tabs.svelte';
  import TabsList from './TabsList.svelte';
  import TabsTrigger from './TabsTrigger.svelte';
  import TabsContent from './TabsContent.svelte';

  let { value = $bindable('a'), onchange }: { value?: string; onchange?: (v: string) => void } = $props();
</script>

<Tabs bind:value {onchange}>
  <TabsList>
    <TabsTrigger value="a">Account</TabsTrigger>
    <TabsTrigger value="b">Password</TabsTrigger>
    <TabsTrigger value="c" disabled>Billing</TabsTrigger>
    <TabsTrigger value="d">Team</TabsTrigger>
  </TabsList>
  <TabsContent value="a">Account panel</TabsContent>
  <TabsContent value="b">Password panel</TabsContent>
  <TabsContent value="c">Billing panel</TabsContent>
  <TabsContent value="d">Team panel</TabsContent>
</Tabs>

<output data-testid="value">{value}</output>
