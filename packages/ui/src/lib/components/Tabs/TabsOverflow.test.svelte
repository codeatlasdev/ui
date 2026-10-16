<script lang="ts">
	import Tabs from "./Tabs.svelte";
	import TabsContent from "./TabsContent.svelte";
	import TabsList from "./TabsList.svelte";
	import TabsTrigger from "./TabsTrigger.svelte";

	let { value = $bindable("general"), fade = false }: { value?: string; fade?: boolean } = $props();
	const names = ["General", "Billing", "Members", "Webhooks", "Security", "Integrations", "Danger zone"];
</script>

<div data-testid="page">
	<Tabs bind:value>
		<TabsList {fade}>
			{#each names as name (name)}
				<TabsTrigger value={name.toLowerCase().replace(" ", "-")}>{name}</TabsTrigger>
			{/each}
		</TabsList>
		{#each names as name (name)}
			<TabsContent value={name.toLowerCase().replace(" ", "-")}>{name} panel</TabsContent>
		{/each}
	</Tabs>
</div>
