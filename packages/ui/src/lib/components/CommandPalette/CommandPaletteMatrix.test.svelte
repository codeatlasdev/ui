<script lang="ts">
	import { FileText, Home, Settings, Users } from "@lucide/svelte";
	import Button from "../Button/Button.svelte";
	import type { NavModule } from "../AppShell/types.js";
	import CommandPalette from "./CommandPalette.svelte";

	const modules: NavModule[] = [
		{
			id: "app",
			label: "Application",
			icon: Home,
			basePath: "/app",
			items: [
				{ id: "dash", label: "Dashboard", icon: Home, path: "/app/dashboard" },
				{ id: "docs", label: "Documents", icon: FileText, path: "/app/docs" },
				{ id: "usr", label: "Users", icon: Users, path: "/app/users" },
			],
		},
		{
			id: "cfg",
			label: "Settings",
			icon: Settings,
			basePath: "/settings",
			items: [
				{ id: "gen", label: "General", icon: Settings, path: "/settings/general" },
				{ id: "sec", label: "Security", icon: Settings, path: "/settings/security" },
			],
		},
	];

	let open = $state(false);
</script>

<div data-testid="matrix" style="padding:24px">
	<Button onclick={() => (open = true)}>Open</Button>
</div>

<CommandPalette {modules} bind:open onNavigate={() => {}} />
