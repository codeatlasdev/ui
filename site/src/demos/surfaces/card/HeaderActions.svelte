<script lang="ts">
  import { Card, Button } from '@codeatlasdev/ui';
</script>

<Card material="glass" title="Team members" class="titled">
  {#snippet headerActions()}<Button size="sm" variant="outlined">Invite</Button>{/snippet}
  <p>Use <code>title</code> and <code>headerActions</code> for a built-in card header.</p>
</Card>

<style>
  :global(.titled) { max-width: 420px; width: 100%; }
  p { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>
