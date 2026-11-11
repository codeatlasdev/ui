<script lang="ts">
  import { Bold, Italic, Pin } from '@lucide/svelte';
  import { Toggle } from '@codeatlasdev/ui';

  let bold = $state(true);
  let italic = $state(false);
  let pinned = $state(false);
</script>

<div style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--ca-space-3)">
  <Toggle icon={Bold} aria-label="Bold" bind:pressed={bold} />
  <Toggle icon={Italic} aria-label="Italic" bind:pressed={italic} />
  <Toggle icon={Pin} label="Pin" variant="ghost" bind:pressed={pinned} />
  <Toggle label="Small" size="sm" />
  <Toggle label="Disabled" disabled />
</div>
