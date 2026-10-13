<script lang="ts">
	import TableOfContents from "./TableOfContents.svelte";
	import type { DocsHeading } from "./types.js";

	const headings: DocsHeading[] = [
		{ id: "intro", text: "Introduction", depth: 2 },
		{ id: "installation", text: "Installation", depth: 2 },
		{ id: "requirements", text: "Requirements", depth: 3 },
		{ id: "usage", text: "Basic usage", depth: 2 },
		{ id: "advanced", text: "Advanced environment configuration", depth: 3 },
	];
</script>

<div
	data-testid="matrix"
	style="display:grid;grid-template-columns:repeat(2,280px);gap:24px;padding:16px;width:max-content;align-items:start"
>
	<TableOfContents {headings} />
	<TableOfContents {headings} variant="inline" />
	<TableOfContents headings={[headings[0]]} />
	<TableOfContents {headings} label="On this page" />
</div>
