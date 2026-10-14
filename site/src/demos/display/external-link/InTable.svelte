<script lang="ts">
  import { ExternalLink, SimpleTable, GlassCard } from '@codeatlasdev/ui';

  const rows = [
    { domain: 'atlas.dev', price: '$12.00', url: 'https://registrar.example/buy?d=atlas.dev' },
    { domain: 'nimbus.io', price: '$38.00', url: 'https://registrar.example/buy?d=nimbus.io' },
    { domain: 'orbit.app', price: '$21.00', url: 'https://registrar.example/buy?d=orbit.app' },
  ];
</script>

<GlassCard flush full>
  <SimpleTable responsive="cards">
    <thead>
      <tr><th>Domain</th><th>Price</th><th>Registrar</th></tr>
    </thead>
    <tbody>
      {#each rows as r (r.domain)}
        <tr>
          <td class="primary">{r.domain}</td>
          <td>{r.price}</td>
          <td><ExternalLink href={r.url}>Buy at registrar</ExternalLink></td>
        </tr>
      {/each}
    </tbody>
  </SimpleTable>
</GlassCard>
