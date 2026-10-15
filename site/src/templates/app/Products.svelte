<script lang="ts">
  import {
    AppList, SimpleTable, StatusChip, Chip,
    TextField, Button, Select, Pagination, Flex,
  } from '@codeatlasdev/ui';
  import { Search, Plus, Trash2, Edit2, Download } from '@lucide/svelte';

  const ALL = [
    { id:  1, name: 'Pro Plan',      category: 'Subscription', price: '$79/mo',  status: 'active',   stock: '∞'  },
    { id:  2, name: 'Team Plan',     category: 'Subscription', price: '$199/mo', status: 'active',   stock: '∞'  },
    { id:  3, name: 'Free Plan',     category: 'Subscription', price: '$0/mo',   status: 'active',   stock: '∞'  },
    { id:  4, name: 'Extra Storage', category: 'Add-on',       price: '$9/mo',   status: 'active',   stock: '500' },
    { id:  5, name: 'API Access',    category: 'Add-on',       price: '$29/mo',  status: 'active',   stock: '200' },
    { id:  6, name: 'Legacy Basic',  category: 'Subscription', price: '$39/mo',  status: 'inactive', stock: '∞'  },
    { id:  7, name: 'Onboarding',    category: 'Service',      price: '$499',    status: 'active',   stock: '50'  },
    { id:  8, name: 'SSO Add-on',    category: 'Add-on',       price: '$49/mo',  status: 'active',   stock: '100' },
    { id:  9, name: 'Priority Sup.', category: 'Service',      price: '$99/mo',  status: 'active',   stock: '∞'  },
    { id: 10, name: 'Data Export',   category: 'Add-on',       price: '$19/mo',  status: 'inactive', stock: '∞'  },
  ];

  const PER_PAGE = 6;

  let search   = $state('');
  let categoryF = $state('');
  let statusF  = $state('');
  let page     = $state(1);

  const categoryOpts = [
    { value: '',             label: 'All categories' },
    { value: 'Subscription', label: 'Subscription'   },
    { value: 'Add-on',       label: 'Add-on'         },
    { value: 'Service',      label: 'Service'        },
  ];
  const statusOpts = [
    { value: '',         label: 'All statuses' },
    { value: 'active',   label: 'Active'       },
    { value: 'inactive', label: 'Inactive'     },
  ];

  const filtered = $derived(ALL.filter(p =>
    (categoryF === '' || p.category === categoryF) &&
    (statusF   === '' || p.status   === statusF)   &&
    p.name.toLowerCase().includes(search.toLowerCase())
  ));

  $effect(() => { filtered; page = 1; });

  const rows = $derived(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));
</script>

<AppList title="Products" description="{filtered.length} of {ALL.length} products">
  {#snippet actions()}
    <Button variant="outlined" size="sm">
      {#snippet leading()}<Download size={14} />{/snippet}
      Export
    </Button>
    <Button variant="filled" size="sm">
      {#snippet leading()}<Plus size={14} />{/snippet}
      New product
    </Button>
  {/snippet}

  {#snippet toolbar()}
    <TextField placeholder="Search products…" bind:value={search} class="ca-search-field">
      {#snippet leading()}<Search size={14} />{/snippet}
    </TextField>
    <Select bind:value={categoryF} options={categoryOpts} />
    <Select bind:value={statusF}   options={statusOpts}   />
    {#if categoryF !== '' || statusF !== ''}
      <Button variant="ghost" size="sm" onclick={() => { categoryF = ''; statusF = ''; }}>
        Clear
      </Button>
    {/if}
  {/snippet}

  <SimpleTable>
    <thead>
      <tr>
        <th>Name</th>
        <th>Category</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Status</th>
        <th class="ca-col-actions"></th>
      </tr>
    </thead>
    <tbody>
      {#each rows as p (p.id)}
        <tr>
          <td class="primary">{p.name}</td>
          <td><Chip label={p.category} size="sm" /></td>
          <td>{p.price}</td>
          <td>{p.stock}</td>
          <td>
            <StatusChip
              status={p.status === 'active' ? 'success' : 'neutral'}
              label={p.status === 'active' ? 'Active' : 'Inactive'}
            />
          </td>
          <td class="ca-col-actions">
            <Flex gap="1" class="ca-row-actions">
              <Button variant="ghost" size="sm" aria-label="Edit"><Edit2 size={13} /></Button>
              <Button variant="ghost" size="sm" aria-label="Delete"><Trash2 size={13} /></Button>
            </Flex>
          </td>
        </tr>
      {/each}
      {#if !rows.length}
        <tr><td colspan="6" class="ca-table-empty">No products match your filters.</td></tr>
      {/if}
    </tbody>
  </SimpleTable>

  {#snippet footer()}
    <span class="ca-page-info">
      {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
    </span>
    <Pagination count={filtered.length} perPage={PER_PAGE} bind:page siblingCount={1} />
  {/snippet}
</AppList>

<style>
  .ca-col-actions { width: 80px; }
</style>
