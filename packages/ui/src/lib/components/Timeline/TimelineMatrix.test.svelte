<script lang="ts">
	import { Check, Wrench } from "@lucide/svelte";
	import { createRawSnippet } from "svelte";
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

	const detail = createRawSnippet(() => ({ render: () => "<p>Detail of the call</p>" }));
	const rich: TimelineItem[] = [
		{ label: "Message in", icon: Check, meta: "120 ms", variant: "success" },
		{ label: "Tool call", icon: Wrench, meta: "failed", variant: "error", children: detail, open: true },
		{ label: "Collapsed", meta: "3 s", children: detail },
	];
</script>

<div data-testid="matrix" style="display:grid;gap:24px;padding:16px;width:360px">
	<Timeline {items} />
	<Timeline items={[{ label: "Single item", date: "10/02/2025" }]} />
	<Timeline items={rich} />
</div>
