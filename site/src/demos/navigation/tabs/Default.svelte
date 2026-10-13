<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@codeatlasdev/ui';
</script>

<div class="wrap">
  <Tabs value="overview">
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="props">Props</TabsTrigger>
      <TabsTrigger value="examples">Examples</TabsTrigger>
    </TabsList>
    <TabsContent value="overview">
      <div class="panel">
        <p>The <strong>Tabs</strong> component implements the WAI-ARIA tabs pattern. Arrow keys cycle through tabs, Home and End jump to the first and last.</p>
      </div>
    </TabsContent>
    <TabsContent value="props">
      <div class="panel">
        <p>Tabs accepts a <code>value</code> prop for controlled mode and <code>onchange</code> for change notifications. Uncontrolled mode works too.</p>
      </div>
    </TabsContent>
    <TabsContent value="examples">
      <div class="panel">
        <p>Common uses: settings pages, detail views with several data categories, code and preview panes, and stepped forms.</p>
      </div>
    </TabsContent>
  </Tabs>
</div>

<style>
  .wrap { width: 100%; max-width: 560px; }
  .panel { padding: 20px 0 8px; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); line-height: 1.6; }
  .panel p { margin: 0; }
  .panel strong { color: var(--ca-text-primary); }
  .panel code {
    font-family: var(--ca-font-mono);
    font-size: 0.9em;
    color: var(--ca-brand-text);
    background: color-mix(in oklch, var(--ca-brand-main) 10%, transparent);
    padding: 1px 5px;
    border-radius: var(--ca-radius-xs);
  }
</style>
