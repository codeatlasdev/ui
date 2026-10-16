<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent, SchemeAsset } from '@codeatlasdev/ui';
  import { Terminal } from '@lucide/svelte';
</script>

<div class="wrap">
  <Tabs value="shell">
    <TabsList>
      <TabsTrigger value="shell">
        {#snippet icon()}<Terminal />{/snippet}
        Shell
      </TabsTrigger>
      <!-- A brand mark keeps its own colors in every state: brandIcon opts it out of the tab's text color. -->
      <TabsTrigger value="claude" brandIcon>
        {#snippet icon()}
          <svg viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#d97757" /><path d="M5 11 8 4l3 7" fill="none" stroke="#fff" stroke-width="1.6" /></svg>
        {/snippet}
        Claude Code
      </TabsTrigger>
      <TabsTrigger value="codex" brandIcon>
        {#snippet icon()}
          <SchemeAsset>
            {#snippet light()}<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#111" /></svg>{/snippet}
            {#snippet dark()}<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#fff" /></svg>{/snippet}
          </SchemeAsset>
        {/snippet}
        Codex
      </TabsTrigger>
    </TabsList>
    <TabsContent value="shell"><div class="panel">Shell session.</div></TabsContent>
    <TabsContent value="claude"><div class="panel">Claude Code session.</div></TabsContent>
    <TabsContent value="codex"><div class="panel">Codex session.</div></TabsContent>
  </Tabs>
</div>

<style>
  .wrap { width: 100%; max-width: 480px; }
  .panel { padding: 20px 0 8px; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>
