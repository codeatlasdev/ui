<script lang="ts">
	import Tabs from "./Tabs.svelte";
	import TabsContent from "./TabsContent.svelte";
	import TabsList from "./TabsList.svelte";
	import TabsTrigger from "./TabsTrigger.svelte";
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
</div>
