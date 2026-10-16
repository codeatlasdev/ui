<script lang="ts">
  import { InstallPrompt } from '@codeatlasdev/ui';
</script>

<!-- The prompt renders nothing until it is mounted in the browser; the box gives the island
     something to intersect (client:visible) and keeps the page from shifting when it appears. -->
<div class="stage">
  <InstallPrompt mode="ios" storageKey="demo-install-ios" />
</div>

<style>
  .stage { min-height: calc(var(--ca-space-8) * 3); }
</style>
