<script lang="ts">
  import { LiquidGlass, GLASS_OPTICS } from '@codeatlasdev/ui';
</script>

<div class="frame">
  <LiquidGlass optics={GLASS_OPTICS.regular} />
  <p>Refraction layer behind this text.</p>
</div>

<style>
  .frame {
    position: relative;
    padding: var(--ca-space-6);
    border-radius: var(--ca-radius-lg);
    overflow: hidden;
  }
</style>
