<script lang="ts">
  import { SimpleTable, Card } from '@codeatlasdev/ui';

  const rows = [
    { name: 'Ana Souza', email: 'ana@example.com', role: 'Admin', status: 'Active' },
    { name: 'Bruno Lima', email: 'bruno@example.com', role: 'Editor', status: 'Invited' },
    { name: 'Carla Dias', email: 'carla@example.com', role: 'Viewer', status: 'Active' },
  ];
</script>

<Card material="glass" flush full>
  <SimpleTable>
    <thead>
      <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr>
          <td class="primary">{r.name}</td>
          <td>{r.email}</td>
          <td>{r.role}</td>
          <td>{r.status}</td>
        </tr>
      {/each}
    </tbody>
  </SimpleTable>
</Card>
