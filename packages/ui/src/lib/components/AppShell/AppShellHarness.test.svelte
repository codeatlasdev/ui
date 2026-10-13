<script lang="ts">
	import { Home, Settings, Users, FileText } from "@lucide/svelte";
	import AppShellLayout from "./AppShellLayout.svelte";
	import SiteHeader from "../SiteHeader/SiteHeader.svelte";
	import type { NavModule } from "./types.js";

	interface Props {
		pathname?: string;
		onNavigate?: (path: string) => void;
		/** Renders header/brand/railBottom/mobile slots. */
		full?: boolean;
		/** Second module has a single destination (no panel). */
		single?: boolean;
		/** The page renders its own <main id="main">: the shell must not add a second target. */
		ownMain?: boolean;
	}

	let { pathname = "/app/dashboard", onNavigate, full = false, single = false, ownMain = false }: Props = $props();

	const modules: NavModule[] = [
		{
			id: "app",
			label: "Application",
			icon: Home,
			basePath: "/app",
			items: [
				{ id: "dash", label: "Dashboard", icon: Home, path: "/app/dashboard" },
				{ id: "docs", label: "Documents", icon: FileText, path: "/app/docs", badge: 3 },
				{
					label: "Admin",
					items: [{ id: "usr", label: "Users", icon: Users, path: "/app/users" }],
				},
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

	const singleModules: NavModule[] = [modules[0], { ...modules[1], items: [modules[1].items[0]] }];
	const mods = $derived(single ? singleModules : modules);
</script>

{#if full}
	<AppShellLayout modules={mods} {pathname} {onNavigate} persistPanel={false}>
		{#snippet header()}
			<SiteHeader />
		{/snippet}
		{#snippet brand()}
			<span>Brand</span>
		{/snippet}
		{#snippet railBottom()}
			<button type="button">Account</button>
		{/snippet}
		{#snippet mobileHeaderActions()}
			<button type="button">Actions</button>
		{/snippet}
		<main>
			<h1>Page content</h1>
		</main>
	</AppShellLayout>
{:else}
	<AppShellLayout modules={mods} {pathname} {onNavigate} persistPanel={false} mainId={ownMain ? null : "main"}>
		{#if ownMain}
			<main id="main" tabindex="-1">
				<h1>Page content</h1>
			</main>
		{:else}
			<main>
				<h1>Page content</h1>
			</main>
		{/if}
	</AppShellLayout>
{/if}
