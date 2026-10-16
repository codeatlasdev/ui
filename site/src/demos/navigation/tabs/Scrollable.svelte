<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@codeatlasdev/ui';

  const sections = ['General', 'Billing', 'Members', 'Webhooks', 'Security', 'Integrations', 'Danger zone'];
  const key = (s: string) => s.toLowerCase().replace(' ', '-');
</script>

<div class="wrap">
  <Tabs value="integrations">
    <TabsList fade>
      {#each sections as s (s)}
        <TabsTrigger value={key(s)}>{s}</TabsTrigger>
      {/each}
    </TabsList>
    {#each sections as s (s)}
      <TabsContent value={key(s)}><div class="panel">{s} settings.</div></TabsContent>
    {/each}
  </Tabs>
</div>

<style>
  .wrap { width: 100%; max-width: 360px; }
  .panel { padding: 20px 0 8px; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>
