<script lang="ts">
  import I18nProvider from '../i18n/I18nProvider.svelte';
  import Board from './dnd.test.svelte';

  let { locale }: { locale: string } = $props();
</script>

<I18nProvider {locale}>
  <Board />
</I18nProvider>
