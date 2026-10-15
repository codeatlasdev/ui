<script lang="ts">
  import { FilterGroup } from '@codeatlasdev/ui';

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' },
  ];
  let role = $state('all');
</script>

<FilterGroup label="Role" options={roles} bind:value={role} />
<p>Selected: {role}</p>
