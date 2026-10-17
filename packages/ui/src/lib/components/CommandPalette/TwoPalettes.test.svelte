<script lang="ts">
	import { Home } from "@lucide/svelte";
	import type { NavModule } from "../AppShell/types.js";
	import CommandPalette from "./CommandPalette.svelte";

	// #329: two palettes on one page; only the first answers Mod+K.
	const modules: NavModule[] = [
		{ id: "general", label: "General", icon: Home, basePath: "/", items: [{ id: "home", label: "Home", icon: Home, path: "/" }] },
	];
	let first = $state(false);
	let second = $state(false);
</script>

<CommandPalette {modules} onNavigate={() => {}} bind:open={first} />
<CommandPalette {modules} onNavigate={() => {}} bind:open={second} shortcut={false} />
<output data-testid="state">{first ? "first" : ""}{second ? "second" : ""}</output>
