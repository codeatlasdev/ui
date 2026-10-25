<script lang="ts">
	import { scrollFocusable } from "./scroll-focusable.js";

	let { later = false }: { later?: boolean } = $props();
	let show = $state(false);
	// Well after the action's first measurement and the first frame.
	$effect(() => {
		if (!later) return;
		const t = setTimeout(() => (show = true), 300);
		return () => clearTimeout(t);
	});
</script>

<!-- The scroller holds a fixed-height wrapper (like the stage's island); the content that
     overflows mounts later, inside that wrapper: two levels below the scroller. -->
<div class="scroller" data-testid="scroller" use:scrollFocusable>
	<div class="wrapper">
		{#if show}<div class="tall">Mounted after the first paint</div>{/if}
	</div>
</div>

<style>
	.scroller { width: 200px; height: 100px; overflow: auto; }
	.wrapper { height: 100%; }
	.tall { height: 400px; }
</style>
