<script lang="ts">
  import { Button, IconButton, Kbd } from '@codeatlasdev/ui';
  import { X } from '@lucide/svelte';
</script>

<div class="dense">
  <Button variant="filled" size="lg">Call next lead</Button>
  <Button variant="outlined" tone="neutral" size="sm">Snooze</Button>
  <Button variant="ghost" tone="neutral" size="sm">Skip</Button>
  <Button variant="outlined" tone="neutral" size="sm" disabled>Reassign</Button>
  <IconButton variant="text" size="sm" aria-label="Close focus mode"><X size={16} /></IconButton>
  <span class="hint">Next lead <Kbd>N</Kbd></span>
</div>

<style>
  /* Component tokens only: no selector against a ca-* class, defaults untouched outside this wrapper. */
  .dense {
    --ca-btn-gap: var(--ca-space-2);
    --ca-btn-line-height: 1.25;
    --ca-btn-letter-spacing: normal;
    --ca-btn-lg-font-weight: 400;
    --ca-btn-lg-font-size: var(--ca-font-size-button);
    --ca-btn-sm-padding-x: var(--ca-space-3);
    --ca-btn-sm-font-size: var(--ca-font-size-body2);
    --ca-btn-ghost-border-width: 0px;
    --ca-icon-btn-size-sm: 36px;
    --ca-kbd-size: var(--ca-space-5);
    --ca-kbd-font-size: var(--ca-font-size-caption);
    --ca-kbd-line-height: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ca-space-3);
  }
  .hint { display: inline-flex; align-items: center; gap: var(--ca-space-1-5); color: var(--ca-text-secondary); }
</style>
