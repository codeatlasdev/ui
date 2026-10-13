<script lang="ts">
	import Button from "../Button/Button.svelte";
	import StickyActions from "./StickyActions.svelte";

	interface Props {
		align?: "end" | "stretch";
		show?: boolean;
	}
	let { align = "end", show = true }: Props = $props();
</script>

<div style="height: 200px; overflow: auto;" data-testid="scroller">
	<div style="height: 600px;">content</div>
	<StickyActions {align} {show}>
		<Button variant="ghost">Cancel</Button>
		<Button variant="filled">Save</Button>
	</StickyActions>
</div>
