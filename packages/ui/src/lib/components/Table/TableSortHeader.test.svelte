<script lang="ts">
  import TableSortHeader from './TableSortHeader.svelte';

  let { sort = 'none', idleIcon }: { sort?: 'none' | 'asc' | 'desc'; idleIcon?: boolean } = $props();
</script>

<table>
  <thead>
    <tr>
      <TableSortHeader {sort} {idleIcon}>Amount</TableSortHeader>
    </tr>
  </thead>
</table>
