<script lang="ts">
	import { Handshake, Home } from "@lucide/svelte";
	import AppShellLayout from "../AppShell/AppShellLayout.svelte";
	import type { NavModule } from "../AppShell/types.js";
	import PageShell from "./PageShell.svelte";

	const modules: NavModule[] = [
		{ id: "a", label: "A", icon: Home, basePath: "/a", items: [{ id: "1", label: "Deals", icon: Home, path: "/a/1" }] },
	];
</script>

<AppShellLayout {modules} pathname="/a/1" persistPanel={false} skipLink={false}>
	<PageShell title="Deals" count={128} icon={Handshake}>
		<p>Body</p>
	</PageShell>
</AppShellLayout>
