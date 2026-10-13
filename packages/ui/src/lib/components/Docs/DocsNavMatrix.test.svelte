<script lang="ts">
	import DocsNav from "./DocsNav.svelte";
	import type { DocsNavGroup } from "./types.js";

	const groups: DocsNavGroup[] = [
		{
			label: "Getting started",
			items: [
				{ href: "/guide/intro", title: "Introduction" },
				{ href: "/guide/installation", title: "Installation" },
			],
		},
		{
			label: "API",
			items: [
				{ href: "/api/sessions", title: "List sessions", badge: "GET" },
				{ href: "/api/sessions/create", title: "Create session", badge: "POST" },
				{ href: "/api/sessions/update", title: "Update session", badge: "PATCH" },
				{ href: "/api/sessions/remove", title: "Remove session", badge: "DELETE" },
			],
		},
		{ items: [{ href: "/changelog", title: "Changelog without a group label" }] },
		{ label: "Empty", items: [] },
	];
</script>

<div data-testid="matrix" style="padding:16px;width:272px">
	<DocsNav {groups} pathname="/api/sessions/create" />
</div>
