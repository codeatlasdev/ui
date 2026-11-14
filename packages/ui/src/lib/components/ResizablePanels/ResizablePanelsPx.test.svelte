<script lang="ts">
  // #996: list + conversation + context with minimums in px, in a container whose width the test changes.
  import ResizablePanels from './ResizablePanels.svelte';
  import ResizablePanel from './ResizablePanel.svelte';
  import ResizableHandle from './ResizableHandle.svelte';

  let { width = 1100, onoverflow }: { width?: number; onoverflow?: (overflow: boolean) => void } = $props();
</script>

<div class="host" style:width="{width}px">
  <ResizablePanels label="Inbox" {onoverflow}>
    <ResizablePanel id="list" defaultSize={20} minSize="280px">List</ResizablePanel>
    <ResizableHandle label="Resize list" />
    <ResizablePanel id="chat" defaultSize={60} minSize="360px">Conversation</ResizablePanel>
    <ResizableHandle label="Resize context" />
    <ResizablePanel id="context" defaultSize={20} minSize="280px">Context</ResizablePanel>
  </ResizablePanels>
</div>

<style>
  .host { height: 300px; }
</style>
