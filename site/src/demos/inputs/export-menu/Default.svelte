<script lang="ts">
  import { ExportMenu } from '@codeatlasdev/ui';

  const rows = [
    { domain: 'atlas.dev', price: 12, available: true },
    { domain: 'nimbus.io', price: 38, available: false },
    { domain: 'orbit.app', price: 21, available: true },
  ];
  let last = $state('');
</script>

<div class="wrap">
  <ExportMenu
    data={rows}
    filename="domains"
    columns={[{ key: 'domain', header: 'Domain' }, { key: 'price', header: 'Price (USD)' }, { key: 'available', header: 'Available' }]}
    onexport={(e) => (last = `${e.filename}: ${e.rows} rows`)}
  />
  <p class="last" aria-live="off">{last || 'Pick a format to download.'}</p>
</div>

<style>
  .wrap { display: flex; align-items: center; gap: var(--ca-space-3); flex-wrap: wrap; }
  .last { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
</style>
