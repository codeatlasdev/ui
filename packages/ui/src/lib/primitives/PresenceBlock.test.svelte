<script lang="ts">
	import { createPresence } from "./index.js";

	interface Props {
		/** Called with every value `present` takes, to prove an exit does not blip through `false`. */
		onPresent?: (present: boolean) => void;
	}
	let { onPresent }: Props = $props();
	let open = $state(true);
	const presence = createPresence(() => open);
	$effect(() => onPresent?.(presence.present));
</script>

<button type="button" onclick={() => (open = !open)}>toggle</button>
{#if presence.present}
	<div id="presence-node" data-state={open ? "open" : "closed"} {@attach presence.ref}>content</div>
{/if}

<style>
	@keyframes presence-fade {
		from { opacity: 1; }
		to { opacity: 0; }
	}
	:global(#presence-node[data-state="closed"]) {
		animation: presence-fade 400ms linear both;
	}
</style>
