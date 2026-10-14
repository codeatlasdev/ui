<script lang="ts">
	import { Plus } from "@lucide/svelte";
	import Button from "../Button/Button.svelte";
	import IconButton from "../Button/IconButton.svelte";
	import ThemeToggle from "../ThemeToggle/ThemeToggle.svelte";
	import PageShell from "./PageShell.svelte";

	let { kind }: { kind: "theme-toggle" | "icon-button" | "labeled" | "mixed" } = $props();
</script>

<div style="display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden">
	<PageShell title="Dashboard" description="Workspace overview.">
		{#snippet actions()}
			{#if kind === "theme-toggle"}
				<ThemeToggle />
			{:else if kind === "icon-button"}
				<IconButton aria-label="Add"><Plus size={18} /></IconButton>
			{:else if kind === "labeled"}
				<Button>Export</Button>
				<Button variant="filled">New report</Button>
			{:else}
				<Button variant="filled">New report</Button>
				<ThemeToggle />
			{/if}
		{/snippet}
		<p>Body</p>
	</PageShell>
</div>
