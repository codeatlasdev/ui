<script lang="ts">
	import Tour from "./Tour.svelte";

	let { onclose }: { onclose?: (r: "done" | "skip") => void } = $props();
	let open = $state(true);
	let step = $state(0);
	const steps = [
		{ target: "#new", title: "Create", body: "Start a new deal here." },
		{ target: "#filters", title: "Filter", body: "Narrow the board." },
	];
</script>

<button id="new" type="button">New deal</button>
<button id="filters" type="button">Filters</button>
<Tour {steps} bind:open bind:step {onclose} />
<output data-testid="state">{open ? `open ${step}` : "closed"}</output>
