<script lang="ts">
	import DocsShell from "./DocsShell.svelte";
	import type { DocsHeading, DocsNavGroup, DocsSearchEntry, DocsSection } from "./types.js";

	const sections: DocsSection[] = [
		{ id: "guide", label: "Guide", href: "/guide" },
		{ id: "api", label: "API", href: "/api" },
	];
	const groups: DocsNavGroup[] = [
		{
			label: "Getting started",
			items: [
				{ href: "/guide/intro", title: "Introduction" },
				{ href: "/guide/installation", title: "Installation" },
			],
		},
		{ label: "API", items: [{ href: "/api/sessions", title: "List sessions", badge: "GET" }] },
	];
	const headings: DocsHeading[] = [
		{ id: "intro", text: "Introduction", depth: 2 },
		{ id: "requirements", text: "Requirements", depth: 3 },
		{ id: "usage", text: "Basic usage", depth: 2 },
	];
	const searchIndex: DocsSearchEntry[] = [];
</script>

<!-- `transform` makes the shell's fixed/sticky descendants resolve against this box. -->
<div
	data-testid="matrix"
	style="transform:translateZ(0);height:640px;overflow:hidden;width:100%;position:relative"
>
	<DocsShell
		{sections}
		active="guide"
		{groups}
		pathname="/guide/intro"
		{headings}
		{searchIndex}
		onnavigate={() => {}}
	>
		{#snippet brand()}<strong>Acme API</strong> <span>Docs</span>{/snippet}
		{#snippet children()}
			<article>
				<h1>Introduction</h1>
				<p>Fixed documentation page content for the visual test.</p>
				<h2 id="intro">Overview</h2>
				<p>Second paragraph with deterministic text.</p>
			</article>
		{/snippet}
	</DocsShell>
</div>
