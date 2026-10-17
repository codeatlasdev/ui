<script lang="ts">
	import { FileText, Home } from "@lucide/svelte";
	import Button from "../Button/Button.svelte";
	import type { NavModule } from "../AppShell/types.js";
	import CommandPalette, { type CommandResult } from "./CommandPalette.svelte";

	interface Props {
		search: (query: string, signal: AbortSignal) => Promise<CommandResult[]>;
		onNavigate?: (path: string) => void;
		onSelect?: (result: CommandResult) => void;
		debounce?: number;
		minQueryLength?: number;
		withModules?: boolean;
	}
	let {
		search,
		onNavigate = () => {},
		onSelect,
		debounce = 0,
		minQueryLength = 1,
		withModules = true,
	}: Props = $props();
	let open = $state(false);
	let query = $state("");

	const modules: NavModule[] = [
		{
			id: "general",
			label: "General",
			icon: Home,
			basePath: "/",
			items: [
				{ id: "home", label: "Home", icon: Home, path: "/" },
				{ id: "reports", label: "Reports", icon: FileText, path: "/reports" },
			],
		},
	];
</script>

<Button onclick={() => (open = true)}>Open palette</Button>
<CommandPalette
	bind:open
	bind:query
	modules={withModules ? modules : []}
	{onNavigate}
	{onSelect}
	{search}
	searchDebounce={debounce}
	{minQueryLength}
/>
<output data-testid="query">{query}</output>
