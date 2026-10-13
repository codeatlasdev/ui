<script lang="ts">
	import Popover from "./Popover.svelte";
</script>

<Popover>
	{#snippet trigger()}Details{/snippet}
	<p>Popover content</p>
	<button type="button">Inner action</button>
</Popover>
