# Page templates

Four page-level components cover every screen type. Pick one; don't build from scratch.

## Which one to use

| Template | Use for |
|---|---|
| `AppList` | Any list, CRUD table, index page |
| `AppForm` | Create / edit forms |
| `AppSettings` | Settings with multiple sections |
| `PageShell` | Dashboards, reports, custom content |

---

## AppList

Fullscreen list layout. Built-in search, filters, pagination, empty state.

### Props

| Prop | Type | Default |
|---|---|---|
| `title` | `string` | — |
| `description` | `string` | auto (row count) |
| `data` | `T[]` | — |
| `searchKeys` | `(keyof T)[]` | all string fields |
| `perPage` | `number` | `20` |
| `idKey` | `keyof T` | `'id'` |
| `maxWidth` | `string` | — |

### Snippets

| Snippet | Args | Use for |
|---|---|---|
| `children` | `ListCtx<T>` (data mode) | table / grid body |
| `actions` | — | top-right CTA |
| `filters` | `ListCtx<T>` | filter controls after search |
| `empty` | `ListCtx<T>` | custom empty state |
| `toolbar` | — | manual mode only |
| `footer` | — | manual mode only |

### ListCtx<T> fields
`rows`, `filtered`, `search`, `page`, `pageInfo`, `count`, `selected`, `filters`, `setFilter`, `clearFilters`, `hasFilters`

### Data-driven mode (recommended)

```svelte
<script>
  import { AppList, SimpleTable, UserCell, StatusChip, FilterGroup, Button } from '@codeatlasdev/ui';
  import { Edit2, Trash2 } from '@lucide/svelte';

  const users = [...]; // full dataset
  const roleOpts = [
    { label: 'All roles', value: '' },
    { label: 'Admin', value: 'admin' },
    { label: 'Member', value: 'member' },
  ];
</script>

<AppList title="Users" data={users} searchKeys={['name', 'email']} perPage={20}>
  {#snippet actions()}
    <Button variant="filled" href="/users/new">+ New user</Button>
  {/snippet}

  {#snippet filters(list)}
    <FilterGroup
      options={roleOpts}
      value={list.filters['role']}
      onchange={v => list.setFilter('role', v)}
    />
  {/snippet}

  {#snippet children(list)}
    <SimpleTable>
      <thead>
        <tr>
          <th>Name</th><th>Role</th><th>Status</th><th></th>
        </tr>
      </thead>
      <tbody>
        {#each list.rows as user (user.id)}
          <tr>
            <td class="primary">
              <UserCell name={user.name} email={user.email} />
            </td>
            <td>{user.role}</td>
            <td><StatusChip status={user.active ? 'success' : 'neutral'} /></td>
            <td>
              <Row gap={4} class="ca-row-actions">
                <Button variant="ghost" size="sm" href="/users/{user.id}/edit">
                  <Edit2 size={13} />
                </Button>
                <Button variant="ghost" size="sm" onclick={() => remove(user.id)}>
                  <Trash2 size={13} />
                </Button>
              </Row>
            </td>
          </tr>
        {/each}
      </tbody>
    </SimpleTable>
  {/snippet}
</AppList>
```

### Manual mode (server-side data)

```svelte
<AppList title="Users" description="{total} users">
  {#snippet toolbar()}
    <TextField placeholder="Search…" bind:value={search} class="ca-search-field" />
    <Select bind:value={roleFilter} options={roleOpts} />
    <span class="ca-toolbar-spacer" />
    <Button variant="outlined" size="sm" onclick={clearFilters}>Clear</Button>
  {/snippet}

  <SimpleTable>…</SimpleTable>

  {#snippet footer()}
    <span class="ca-page-info">{pageStart}–{pageEnd} of {total}</span>
    <Pagination count={total} perPage={20} bind:page />
  {/snippet}
</AppList>
```

---

## AppForm

Page-level form: sticky header with back button, scrollable body, sticky footer.

### Props

| Prop | Type | Notes |
|---|---|---|
| `title` | `string` | |
| `description` | `string` | |
| `backHref` | `string` | Renders back-arrow link |

### Snippets: `footer` (required, action buttons)

```svelte
<AppForm title="New user" description="Fill in the details." backHref="/users">
  <FormSection title="Account">
    <TextField label="Full name" bind:value={name} />
    <TextField label="Email" type="email" bind:value={email} />
    <Select label="Role" bind:value={role} options={roleOpts} />
  </FormSection>

  <FormSection title="Notifications" layout="list">
    <Switch label="Send welcome email" bind:checked={sendWelcome} />
  </FormSection>

  {#snippet footer()}
    <Button variant="ghost" href="/users">Cancel</Button>
    <Button variant="filled" type="submit" disabled={saving}>
      {saving ? 'Saving…' : 'Create user'}
    </Button>
  {/snippet}
</AppForm>
```

### FormSection layouts

| `layout` | Use for |
|---|---|
| `"grid"` (default) | Text fields, selects, number fields: auto 2-col |
| `"list"` | Switches, SettingItem, Dividers: single col, flush |
| `"stack"` | Avatar + fields, composite blocks: single col |

Never wrap fields in `<Stack>` inside a `FormSection`. The `layout` prop handles spacing.

---

## AppSettings

Settings page with left-side section nav. GitHub/Vercel style.

```svelte
<script>
  const TABS = [
    { id: 'general', label: 'General' },
    { id: 'security', label: 'Security' },
    { id: 'billing', label: 'Billing' },
  ];
</script>

<AppSettings title="Settings" {tabs}>
  {#snippet actions()}
    <Button variant="filled" size="sm" onclick={save}>Save changes</Button>
  {/snippet}

  {#snippet children(tab)}
    {#if tab === 'general'}
      <FormSection title="Workspace">
        <TextField label="Name" bind:value={name} />
        <Select label="Timezone" bind:value={tz} options={tzOpts} />
      </FormSection>
    {/if}

    {#if tab === 'security'}
      <FormSection title="Authentication" layout="list">
        <SettingItem label="Two-factor authentication" description="Require 2FA for all members.">
          <Switch bind:checked={mfaEnabled} />
        </SettingItem>
        <Divider />
        <SettingItem label="Single sign-on" description="SAML or OIDC provider.">
          <Switch bind:checked={ssoEnabled} />
        </SettingItem>
      </FormSection>
    {/if}
  {/snippet}
</AppSettings>
```

---

## PageShell

Dashboard layout: normal scroll, free content.

```svelte
<PageShell title="Dashboard" description="Overview" maxWidth="1200px" gap={24}>
  {#snippet actions()}
    <Button variant="ghost" size="sm">Export</Button>
    <Select bind:value={period} options={periodOpts} />
  {/snippet}

  <KpiGrid>
    <KpiCard title="Revenue" value="$112k" trend={18.4} />
    <KpiCard title="Users" value="24.8k" trend={12.1} />
  </KpiGrid>

  <GlassCard title="Revenue vs Expenses">
    <LineChart {series} {categories} area height="260px" />
  </GlassCard>
</PageShell>
```
