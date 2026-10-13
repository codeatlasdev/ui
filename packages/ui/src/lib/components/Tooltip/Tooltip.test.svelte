<script lang="ts">
	import Tooltip from "./Tooltip.svelte";

	interface Props {
		delay?: number;
	}
	let { delay = 0 }: Props = $props();
</script>

<Tooltip content="Save changes" {delay}>Save</Tooltip>
<button type="button">After</button>
