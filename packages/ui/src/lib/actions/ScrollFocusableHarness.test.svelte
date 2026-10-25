<script lang="ts">
	import { scrollFocusable } from "./scroll-focusable.js";

	let show = $state(false);
	// The test decides when the overflowing content mounts (after its first assertion), not a timer
	// a slow machine can outrun. A test that never calls this renders a scroller with nothing in it.
	export function reveal() {
		show = true;
	}
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
