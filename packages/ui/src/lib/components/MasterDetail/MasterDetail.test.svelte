<script lang="ts">
	import { untrack } from "svelte";
	import EmptyState from "../EmptyState/EmptyState.svelte";
	import MasterDetail from "./MasterDetail.svelte";

	interface Props {
		selected?: string | null;
		width?: string;
		onback?: () => void;
		history?: boolean;
		resizable?: boolean;
	}
	let { selected = $bindable(null), width = "100%", onback, history, resizable = false }: Props = $props();
	const rows = ["maria", "joao", "ana"];
	let mounts = $state(0);
	function counted() {
		// `untrack`: an attachment is an effect, and `mounts++` reads before it writes.
		untrack(() => mounts++);
	}
</script>

<div style="width:{width};height:500px" data-testid="frame">
	<MasterDetail bind:selected detailTitle={selected ? `Chat ${selected}` : ""} {onback} {history} {resizable} listWidth="18rem">
		{#snippet master()}
			<ul style="margin:0;padding:0;list-style:none">
				{#each rows as id (id)}
					<li><button type="button" onclick={() => (selected = id)}>Open {id}</button></li>
				{/each}
			</ul>
		{/snippet}
		{#snippet detail()}
			<div data-testid="thread" {@attach counted}><input aria-label="Reply" /></div>
		{/snippet}
		{#snippet empty()}
			<EmptyState title="Select a conversation" />
		{/snippet}
	</MasterDetail>
</div>
<output data-testid="mounts">{mounts}</output>
<output data-testid="selected">{selected ?? "none"}</output>
