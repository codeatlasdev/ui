<script lang="ts">
  import { Avatar } from '@codeatlasdev/ui';
</script>

<ul class="people">
  {#each ['Ada Lovelace', 'Grace Hopper'] as name}
    <li>
      <Avatar alt={name} size="sm" decorative />
      <span>{name}</span>
    </li>
  {/each}
</ul>

<style>
  .people { display: grid; gap: var(--ca-space-2); margin: 0; padding: 0; list-style: none; }
  li { display: flex; align-items: center; gap: var(--ca-space-2); }
</style>
