<script lang="ts">
  import { Select } from '@codeatlasdev/ui';

  let project = $state('');

  const projects = [
    { value: '', label: 'All projects' },
    { value: 'web', label: 'Web app' },
    { value: 'api', label: 'API' },
    { value: 'docs', label: 'Docs' },
  ];
</script>

<div class="col">
  <Select label="Project" placeholder="Choose a project…" options={projects} bind:value={project} />
  <p class="out">Filter value: <code>{JSON.stringify(project)}</code></p>
</div>

<style>
  .col {
    width: 100%;
    max-width: 320px;
  }
  .out {
    margin: var(--ca-space-2) 0 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
</style>
