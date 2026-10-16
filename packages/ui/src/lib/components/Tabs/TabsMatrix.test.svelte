<script lang="ts">
	import Tabs from "./Tabs.svelte";
	import TabsContent from "./TabsContent.svelte";
	import TabsList from "./TabsList.svelte";
	import TabsTrigger from "./TabsTrigger.svelte";
	import SchemeAsset from "../SchemeAsset/SchemeAsset.svelte";
</script>

<div data-testid="matrix" style="display:grid;gap:24px;padding:16px;width:520px">
	<Tabs value="a">
		<TabsList>
			<TabsTrigger value="a">Account</TabsTrigger>
			<TabsTrigger value="b">Password</TabsTrigger>
			<TabsTrigger value="c" disabled>Billing</TabsTrigger>
			<TabsTrigger value="d">Team</TabsTrigger>
		</TabsList>
		<TabsContent value="a">Account panel</TabsContent>
		<TabsContent value="b">Password panel</TabsContent>
		<TabsContent value="c">Billing panel</TabsContent>
		<TabsContent value="d">Team panel</TabsContent>
	</Tabs>
	<Tabs value="b">
		<TabsList>
			<TabsTrigger value="a">Overview</TabsTrigger>
			<TabsTrigger value="b">Advanced settings</TabsTrigger>
		</TabsList>
		<TabsContent value="a">Overview panel</TabsContent>
		<TabsContent value="b">Advanced panel</TabsContent>
	</Tabs>
	<Tabs value="a">
		<TabsList>
			<TabsTrigger value="a">
				{#snippet icon()}<svg viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5" /></svg>{/snippet}
				Plain
			</TabsTrigger>
			<TabsTrigger value="b" brandIcon>
				{#snippet icon()}
					<SchemeAsset>
						{#snippet light()}<svg viewBox="0 0 10 10"><rect width="10" height="10" rx="2" fill="#d97757" /></svg>{/snippet}
						{#snippet dark()}<svg viewBox="0 0 10 10"><rect width="10" height="10" rx="2" fill="#faf9f5" /></svg>{/snippet}
					</SchemeAsset>
				{/snippet}
				Brand
			</TabsTrigger>
		</TabsList>
		<TabsContent value="a">Plain panel</TabsContent>
		<TabsContent value="b">Brand panel</TabsContent>
	</Tabs>
</div>
