<script lang="ts">
  // Users list shared by the admin and app templates; each passes its rows (dates differ) and its "new user" route.
  import {
    AppList, SimpleTable, UserCell, StatusChip, Checkbox,
    Button, Flex, FilterGroup, Chip,
  } from '@codeatlasdev/ui';
  import { Plus, Trash2, Edit2, Download } from '@lucide/svelte';

  interface UserRow {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    plan: string;
    joined: string;
  }
  interface Props {
    users: UserRow[];
    newUserHref: string;
    /** Wording of the bulk-selection chip: "3 {selectedLabel}". */
    selectedLabel: string;
  }
  let { users, newUserHref, selectedLabel }: Props = $props();

  const roleOpts   = [{ value: 'Admin', label: 'Admin' }, { value: 'Editor', label: 'Editor' }, { value: 'Viewer', label: 'Viewer' }];
  const statusOpts = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];
  const planOpts   = [{ value: 'Pro', label: 'Pro' }, { value: 'Team', label: 'Team' }, { value: 'Free', label: 'Free' }];
</script>

<AppList
  title="Users"
  data={users}
  searchKeys={['name', 'email']}
  perPage={8}
>
  {#snippet actions()}
    <Button variant="ghost" size="sm" aria-label="Export">
      {#snippet leading()}<Download size={14} />{/snippet}
    </Button>
    <Button variant="filled" size="sm" href={newUserHref}>
      {#snippet leading()}<Plus size={14} />{/snippet}
      New user
    </Button>
  {/snippet}

  {#snippet filters(list)}
    <FilterGroup options={roleOpts}   value={list.filters['role']   ?? 'all'} onchange={v => list.setFilter('role',   v)} />
    <FilterGroup options={statusOpts} value={list.filters['status'] ?? 'all'} onchange={v => list.setFilter('status', v)} />
    <FilterGroup options={planOpts}   value={list.filters['plan']   ?? 'all'} onchange={v => list.setFilter('plan',   v)} />
    {#if list.selected.size > 0}
      <Chip label="{list.selected.size} {selectedLabel}" variant="brand" size="sm" />
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
          <th>User</th><th>Role</th><th>Plan</th><th>Status</th><th>Joined</th>
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
              <Flex gap="1" class="ca-row-actions">
                <Button variant="ghost" size="sm" aria-label="Edit"><Edit2 size={13} /></Button>
                <Button variant="ghost" size="sm" aria-label="Delete"><Trash2 size={13} /></Button>
              </Flex>
            </td>
          </tr>
        {/each}
      </tbody>
    </SimpleTable>
  {/snippet}
</AppList>
