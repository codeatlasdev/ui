<script lang="ts">
	import Tabs from "./Tabs.svelte";
	import TabsContent from "./TabsContent.svelte";
	import TabsList from "./TabsList.svelte";
	import TabsTrigger from "./TabsTrigger.svelte";

	let { variant, withPanel = false }: { variant?: "pill" | "line"; withPanel?: boolean } = $props();
</script>

<Tabs value="a" {variant}>
	<TabsList aria-label="View" data-testid="views">
		<TabsTrigger value="a" data-testid="view-a">A</TabsTrigger>
		<TabsTrigger value="b" data-testid="view-b">B</TabsTrigger>
	</TabsList>
	{#if withPanel}
		<TabsContent value="a">Panel A</TabsContent>
	{/if}
</Tabs>
