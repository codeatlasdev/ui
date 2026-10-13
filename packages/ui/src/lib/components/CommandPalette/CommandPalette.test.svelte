<script lang="ts">
	import { FileText, Home, Settings } from "@lucide/svelte";
	import Button from "../Button/Button.svelte";
	import type { NavModule } from "../AppShell/types.js";
	import CommandPalette from "./CommandPalette.svelte";

	interface Props {
		onNavigate?: (path: string) => void;
		minQueryLength?: number;
	}
	let { onNavigate = () => {}, minQueryLength }: Props = $props();
	let open = $state(false);

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
		{
			id: "account",
			label: "Account",
			icon: Settings,
			basePath: "/account",
			items: [{ id: "profile", label: "Profile", icon: Settings, path: "/account/profile" }],
		},
	];
</script>

<Button onclick={() => (open = true)}>Open palette</Button>
<CommandPalette bind:open {modules} {onNavigate} {minQueryLength} />
