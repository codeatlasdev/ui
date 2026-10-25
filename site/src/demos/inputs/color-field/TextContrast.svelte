<script lang="ts">
  import { ColorField } from '@codeatlasdev/ui';

  let text = $state('#6b7280');
  const page = '#ffffff';
</script>

<div class="col">
  <ColorField label="Body text" bind:value={text} against={page} minRatio={4.5} format="oklch" />
  <div class="sample" style="--sample-ink:{text}">
    <p class="sample__p">The quick brown fox jumps over the lazy dog.</p>
  </div>
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    max-inline-size: 22rem;
  }

  .sample {
    padding: var(--ca-space-3);
    background: #ffffff;
    border-radius: var(--ca-radius-md);
  }

  .sample__p {
    margin: 0;
    color: var(--sample-ink);
  }
</style>
