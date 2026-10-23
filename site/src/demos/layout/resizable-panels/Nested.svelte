<script lang="ts">
  import { ResizableHandle, ResizablePanel, ResizablePanels } from '@codeatlasdev/ui';
</script>

<div class="frame">
  <ResizablePanels label="Mail" persist="ca-demo-mail-layout">
    <ResizablePanel id="folders" defaultSize={20} minSize={12}>
      <p class="pane">Folders</p>
    </ResizablePanel>
    <ResizableHandle label="Resize folders" />
    <ResizablePanel id="main" defaultSize={80}>
      <ResizablePanels direction="vertical" label="Message list and reader">
        <ResizablePanel id="list" defaultSize={40} minSize={20}>
          <p class="pane">Messages</p>
        </ResizablePanel>
        <ResizableHandle label="Resize message list" />
        <ResizablePanel id="reader" defaultSize={60} minSize={20}>
          <p class="pane">Reader</p>
        </ResizablePanel>
      </ResizablePanels>
    </ResizablePanel>
  </ResizablePanels>
</div>

<style>
  .frame { height: 14rem; max-width: 36rem; border: var(--ca-border-width) solid var(--ca-outline-default); border-radius: var(--ca-radius-md); overflow: hidden; }
  .pane { margin: 0; padding: var(--ca-space-3); color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); }
</style>
