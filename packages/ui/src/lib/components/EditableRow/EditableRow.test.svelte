<script lang="ts">
	import EditableRow from "./EditableRow.svelte";

	let { width = 320, open = $bindable(false) }: { width?: number; open?: boolean } = $props();
</script>

<div style="width:{width}px">
	<EditableRow label="Lost" bind:open>
		{#snippet summary()}<strong>Lost</strong>{/snippet}
		<label>Name <input value="Lost" /></label>
		<label>Kind <input value="lost" /></label>
		<label>Days <input value="7" /></label>
		{#snippet actions()}<button type="button">Delete Lost</button>{/snippet}
	</EditableRow>
</div>
