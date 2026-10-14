<script lang="ts">
  import Spinner from '../components/Spinner/Spinner.svelte';
  import TableOfContents from '../components/Docs/TableOfContents.svelte';
  import I18nProvider from './I18nProvider.svelte';

  let { locale }: { locale: string } = $props();
</script>

<I18nProvider {locale}>
  <Spinner />
  <TableOfContents headings={[{ id: 'a', text: 'Alpha', depth: 2 }, { id: 'b', text: 'Beta', depth: 2 }]} />
</I18nProvider>
