<script lang="ts">
  import EmptyState from './EmptyState.svelte';
  import GlassCard from '../GlassCard/GlassCard.svelte';
  import PageShell from '../PageShell/PageShell.svelte';

  let { headingLevel, cardLevel }: { headingLevel?: 2 | 3 | 4 | 5 | 6; cardLevel?: 2 | 3 | 4 | 5 | 6 } = $props();
</script>

<PageShell title="Inbox">
  <EmptyState title="Nothing here" {headingLevel} />
  <GlassCard title="Summary" headingLevel={cardLevel}>Body</GlassCard>
</PageShell>
