<script lang="ts">
  import { Text } from '@codeatlasdev/ui';

  const roles = [
    { role: 'title', sample: 'Quarterly pipeline' },
    { role: 'heading', sample: 'Leads by channel' },
    { role: 'body', sample: 'Follow up with every lead within a day.' },
    { role: 'label', sample: 'Company name' },
    { role: 'caption', sample: 'Updated 3 minutes ago' },
    { role: 'num', sample: '1,284 leads, 18:42' },
  ] as const;
</script>

<dl class="roles">
  {#each roles as r (r.role)}
    <div class="roles__row">
      <dt><code>{r.role}</code></dt>
      <dd><Text role={r.role}>{r.sample}</Text></dd>
    </div>
  {/each}
</dl>

<style>
  .roles {
    display: grid;
    gap: var(--ca-space-3);
    margin: 0;
  }
  .roles__row {
    display: grid;
    grid-template-columns: var(--ca-space-20) 1fr;
    align-items: baseline;
    gap: var(--ca-space-3);
  }
  dt,
  dd {
    margin: 0;
  }
</style>
