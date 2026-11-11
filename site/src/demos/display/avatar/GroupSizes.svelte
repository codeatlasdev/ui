<script lang="ts">
  import { AvatarGroup } from '@codeatlasdev/ui';

  const team = [
    { name: 'Alice Moreira' },
    { name: 'Bob Tavares' },
    { name: 'Clara Nunes' },
    { name: 'Davi Prado' },
    { name: 'Eva Ramos' },
  ];
</script>

<div class="rows">
  {#each ['xs', 'sm', 'md', 'lg', 'xl'] as const as size (size)}
    <AvatarGroup items={team} max={3} {size} label="Team, size {size}" />
  {/each}
  <AvatarGroup items={team} max={3} size="md" shape="rounded" label="Team, rounded" />
</div>

<style>
  .rows { display: grid; gap: var(--ca-space-3); justify-items: start; }
</style>
