<script lang="ts">
	import I18nProvider from "../../i18n/I18nProvider.svelte";
	import Table from "./DataTableV2.test.svelte";

	let { locale }: { locale: string } = $props();
</script>

<I18nProvider {locale}>
	<Table />
</I18nProvider>
