<script lang="ts">
	import PageFrame from "./PageFrame.svelte";

	type Props = Omit<import("svelte").ComponentProps<typeof PageFrame>, "children" | "header" | "toolbar" | "footer"> & {
		withHeader?: boolean;
		withToolbar?: boolean;
		withFooter?: boolean;
		rows?: number;
		/** Pass no header/toolbar/footer snippets at all. */
		bare?: boolean;
	};
	let { withHeader = true, withToolbar = false, withFooter = false, rows = 3, bare = false, detent = $bindable("half"), ...rest }: Props = $props();
</script>

<!-- A stage stand-in: the frame floats over it, like over the AppShell content area. -->
<div class="host" style="position:relative;width:100vw;height:100vh">
	<button type="button" data-testid="stage" style="position:absolute;inset:0;width:100%;height:100%">stage</button>
	{#snippet header()}{#if withHeader}<h2>Territory</h2>{/if}{/snippet}
	{#snippet toolbar()}{#if withToolbar}<input aria-label="Search" />{/if}{/snippet}
	{#snippet footer()}{#if withFooter}<button type="button">Save</button>{/if}{/snippet}
	{#snippet rowsList()}{#each Array.from({ length: rows }) as _, i}<p data-testid="row">Row {i}</p>{/each}{/snippet}
	{#if bare}
		<PageFrame label="Lead" {...rest} bind:detent>{@render rowsList()}</PageFrame>
	{:else}
		<PageFrame label="Lead" {...rest} bind:detent {header} toolbar={withToolbar ? toolbar : undefined} footer={withFooter ? footer : undefined}>{@render rowsList()}</PageFrame>
	{/if}
</div>
