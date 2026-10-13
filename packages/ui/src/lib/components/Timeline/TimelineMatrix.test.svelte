<script lang="ts">
	import Timeline from "./Timeline.svelte";
	import type { TimelineItem } from "./Timeline.svelte";

	const items: TimelineItem[] = [
		{ label: "Default", description: "Default event", date: "01/01/2025" },
		{ label: "Success", description: "Completed successfully", date: "02/01/2025", variant: "success" },
		{ label: "Info", date: "03/01/2025", variant: "info" },
		{ label: "Warning", description: "Needs attention", variant: "warning" },
		{
			label: "Error",
			description:
				"A long description to check line wrapping inside the timeline content.",
			date: "05/01/2025",
			variant: "error",
		},
	];
</script>

<div data-testid="matrix" style="display:grid;gap:24px;padding:16px;width:360px">
	<Timeline {items} />
	<Timeline items={[{ label: "Single item", date: "10/02/2025" }]} />
</div>
