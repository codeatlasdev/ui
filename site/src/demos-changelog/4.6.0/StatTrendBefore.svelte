<script lang="ts">
  import { Stat } from '@codeatlasdev/ui';
</script>

<div class="grid">
  <Stat label="Revenue" value="48,200" unit="USD" trend={12.4} />
  <Stat label="Churn" value="2.1" unit="%" trend={-1.8} />
  <Stat label="Active seats" value="1,204" trend={0.4} />
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: var(--ca-space-5); }
</style>
