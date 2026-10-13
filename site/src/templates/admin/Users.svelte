<script lang="ts">
  import {
    AppList, SimpleTable, UserCell, StatusChip, Checkbox,
    Button, Row, FilterGroup, Chip,
  } from '@codeatlasdev/ui';
  import { Plus, Trash2, Edit2, Download } from '@lucide/svelte';

  const ALL = [
    { id:  1, name: 'Ana Lima',        email: 'ana@acme.com',     role: 'Admin',  status: 'active',   plan: 'Pro',  joined: '18 Sep' },
    { id:  2, name: 'Carlos Melo',     email: 'carlos@apex.io',   role: 'Editor', status: 'active',   plan: 'Free', joined: '17 Sep' },
    { id:  3, name: 'Diana Kwan',      email: 'diana@nova.dev',   role: 'Viewer', status: 'inactive', plan: 'Team', joined: '15 Sep' },
    { id:  4, name: 'Eduardo S.',      email: 'edu@mesh.ai',      role: 'Editor', status: 'active',   plan: 'Pro',  joined: '14 Sep' },
    { id:  5, name: 'Fiona Clarke',    email: 'fi@relay.io',      role: 'Admin',  status: 'active',   plan: 'Team', joined: '12 Sep' },
    { id:  6, name: 'George Hart',     email: 'george@orbit.dev', role: 'Viewer', status: 'active',   plan: 'Free', joined: '10 Sep' },
    { id:  7, name: 'Hana Park',       email: 'hana@forge.io',    role: 'Editor', status: 'inactive', plan: 'Pro',  joined: '08 Sep' },
    { id:  8, name: 'Ivan Torres',     email: 'ivan@stack.io',    role: 'Viewer', status: 'active',   plan: 'Free', joined: '05 Sep' },
    { id:  9, name: 'Julia Santos',    email: 'julia@wave.io',    role: 'Editor', status: 'active',   plan: 'Pro',  joined: '03 Sep' },
    { id: 10, name: 'Kevin Zhao',      email: 'kevin@drift.dev',  role: 'Viewer', status: 'active',   plan: 'Free', joined: '01 Sep' },
    { id: 11, name: 'Laura Mendes',    email: 'laura@arc.dev',    role: 'Admin',  status: 'active',   plan: 'Team', joined: '30 Aug' },
    { id: 12, name: 'Miguel Ferreira', email: 'miguel@pulse.io',  role: 'Editor', status: 'inactive', plan: 'Free', joined: '28 Aug' },
  ];

  const roleOpts   = [{ value: 'Admin', label: 'Admin' }, { value: 'Editor', label: 'Editor' }, { value: 'Viewer', label: 'Viewer' }];
  const statusOpts = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];
  const planOpts   = [{ value: 'Pro', label: 'Pro' }, { value: 'Team', label: 'Team' }, { value: 'Free', label: 'Free' }];
</script>

<AppList
  title="Users"
  data={ALL}
  searchKeys={['name', 'email']}
  perPage={8}
  searchPlaceholder="Search…"
>
  {#snippet actions()}
    <Button variant="ghost" size="sm" aria-label="Export">
      {#snippet leading()}<Download size={14} />{/snippet}
    </Button>
    <Button variant="filled" size="sm" href="/templates/admin/users/new/">
      {#snippet leading()}<Plus size={14} />{/snippet}
      New user
    </Button>
  {/snippet}

  {#snippet filters(list)}
    <FilterGroup options={roleOpts}   value={list.filters['role']   ?? 'all'} onchange={v => list.setFilter('role',   v)} />
    <FilterGroup options={statusOpts} value={list.filters['status'] ?? 'all'} onchange={v => list.setFilter('status', v)} />
    <FilterGroup options={planOpts}   value={list.filters['plan']   ?? 'all'} onchange={v => list.setFilter('plan',   v)} />
    {#if list.selected.size > 0}
      <Chip label="{list.selected.size} selecionados" variant="brand" size="sm" />
      <Button variant="ghost" size="sm" class="ca-btn-danger-ghost">
        {#snippet leading()}<Trash2 size={13} />{/snippet}
        Delete
      </Button>
    {/if}
  {/snippet}

  {#snippet children(list)}
    <SimpleTable>
      <thead>
        <tr>
          <th class="ca-col-check">
            <Checkbox checked={list.allPageSelected} onchange={() => list.toggleAll()} aria-label="Select all" />
          </th>
          <th>User</th>
          <th>Role</th>
          <th>Plan</th>
          <th>Status</th>
          <th>Joined</th>
          <th class="ca-col-actions"></th>
        </tr>
      </thead>
      <tbody>
        {#each list.rows as u (u.id)}
          <tr class:ca-row--selected={list.selected.has(u.id)}>
            <td class="ca-col-check">
              <Checkbox checked={list.selected.has(u.id)} onchange={() => list.toggleRow(u.id)} aria-label="Select {u.name}" />
            </td>
            <td class="primary"><UserCell name={u.name} email={u.email} /></td>
            <td>{u.role}</td>
            <td>{u.plan}</td>
            <td>
              <StatusChip
                status={u.status === 'active' ? 'success' : 'neutral'}
                label={u.status === 'active' ? 'Active' : 'Inactive'}
              />
            </td>
            <td>{u.joined}</td>
            <td class="ca-col-actions">
              <Row gap={4} class="ca-row-actions">
                <Button variant="ghost" size="sm" aria-label="Edit"><Edit2 size={13} /></Button>
                <Button variant="ghost" size="sm" aria-label="Delete"><Trash2 size={13} /></Button>
              </Row>
            </td>
          </tr>
        {/each}
      </tbody>
    </SimpleTable>
  {/snippet}
</AppList>
