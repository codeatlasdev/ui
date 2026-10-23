<script lang="ts">
  import { ResizableHandle, ResizablePanel, ResizablePanels } from '@codeatlasdev/ui';

  let sizes = $state<number[]>([25, 75]);
</script>

<div class="frame">
  <ResizablePanels label="Workspace" onlayout={(s) => (sizes = s)}>
    <ResizablePanel id="files" defaultSize={25} minSize={15} maxSize={50}>
      <p class="pane">Files</p>
    </ResizablePanel>
    <ResizableHandle label="Resize files" />
    <ResizablePanel id="editor" defaultSize={75}>
      <p class="pane">Editor</p>
    </ResizablePanel>
  </ResizablePanels>
</div>
<p class="note">Files {Math.round(sizes[0])}% · Editor {Math.round(sizes[1])}%. Focus the handle and use the arrow keys.</p>

<style>
  .frame { height: 12rem; max-width: 36rem; border: var(--ca-border-width) solid var(--ca-outline-default); border-radius: var(--ca-radius-md); overflow: hidden; }
  .pane { margin: 0; padding: var(--ca-space-3); color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); }
  .note { margin: var(--ca-space-2) 0 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); }
</style>
