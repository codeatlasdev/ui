<script lang="ts">
	import SchemeAsset from "../SchemeAsset/SchemeAsset.svelte";
	import Tabs from "./Tabs.svelte";
	import TabsContent from "./TabsContent.svelte";
	import TabsList from "./TabsList.svelte";
	import TabsTrigger from "./TabsTrigger.svelte";
</script>

<Tabs value="a">
	<TabsList>
		<TabsTrigger value="a">
			{#snippet icon()}<svg data-testid="plain" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5" /></svg>{/snippet}
			Plain
		</TabsTrigger>
		<TabsTrigger value="b" brandIcon>
			{#snippet icon()}
				<SchemeAsset>
					{#snippet light()}<svg data-testid="brand-light" viewBox="0 0 10 10"><rect width="10" height="10" fill="#d97757" /></svg>{/snippet}
					{#snippet dark()}<svg data-testid="brand-dark" viewBox="0 0 10 10"><rect width="10" height="10" fill="#faf9f5" /></svg>{/snippet}
				</SchemeAsset>
			{/snippet}
			Brand
		</TabsTrigger>
		<TabsTrigger value="c" disabled brandIcon>
			{#snippet icon()}<svg data-testid="brand-disabled" viewBox="0 0 10 10"><rect width="10" height="10" fill="#d97757" /></svg>{/snippet}
			Off
		</TabsTrigger>
	</TabsList>
	<TabsContent value="a">A</TabsContent>
	<TabsContent value="b">B</TabsContent>
	<TabsContent value="c">C</TabsContent>
</Tabs>
