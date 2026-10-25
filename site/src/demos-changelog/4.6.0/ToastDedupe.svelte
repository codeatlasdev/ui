<script lang="ts">
  import { Button, Toaster, toast } from '@codeatlasdev/ui';

  function fail() {
    for (let i = 0; i < 10; i++) toast.error('Could not reach the server.');
  }

  function upload() {
    toast.info('Uploading report.pdf…', { id: 'upload', duration: 0 });
    setTimeout(() => toast.success('report.pdf uploaded.', { id: 'upload' }), 1500);
  }

  function archive() {
    toast.success('Report archived', {
      description: 'It moved to the Archive folder.',
      action: { label: 'Undo', onClick: () => toast.info('Report restored.') },
    });
  }
</script>

<Toaster />

<div class="col">
  <div class="row">
    <Button variant="outlined" onclick={fail}>Fail 10 times</Button>
    <Button variant="outlined" onclick={upload}>Upload</Button>
    <Button variant="outlined" onclick={archive}>Archive report</Button>
  </div>
  <p class="hint">
    Ten identical errors leave one toast with a ×10 badge. Upload replaces its toast in place.
    The archive toast carries a description and an Undo action.
  </p>
</div>

<style>
  .col { display: grid; gap: var(--ca-space-3); }
  .row { display: flex; flex-wrap: wrap; gap: var(--ca-space-3); }
  .hint { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); }
</style>
