<script lang="ts">
  import { AspectRatio } from '@codeatlasdev/ui';
</script>

<div class="frame">
  <AspectRatio ratio={16 / 9}>
    <div class="slot">16 / 9: any child, one box</div>
  </AspectRatio>
</div>

<style>
  .frame { max-width: 28rem; border-radius: var(--ca-radius-md); overflow: hidden; }
  .slot {
    display: grid;
    place-items: center;
    height: 100%;
    background: var(--ca-surface-sunken);
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-caption);
  }
</style>
