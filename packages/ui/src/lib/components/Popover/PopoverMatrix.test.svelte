<script lang="ts">
	import Popover from "./Popover.svelte";
</script>

<div data-testid="matrix" style="padding:24px">
	<Popover>
		{#snippet trigger()}Details{/snippet}
		<p style="margin:0 0 8px;font-weight:600">Order summary</p>
		<p style="margin:0">Three items, delivery expected in five business days.</p>
	</Popover>
</div>
