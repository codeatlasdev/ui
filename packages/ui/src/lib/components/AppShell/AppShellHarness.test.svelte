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
		/** `id` of the shell's own <main> (default "main"). Ignored when `ownMain`. */
		mainId?: string;
		/** Keep panel, module, sections and scroll in storage (off by default: tests start clean). */
		persist?: boolean;
		/** First module is the catch-all `basePath: "/"` with a root item `path: "/"` (#274). */
		root?: boolean;
	}

	let { pathname = "/app/dashboard", onNavigate, full = false, single = false, ownMain = false, mainId = "main", persist = false, root = false }: Props = $props();

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
				{
					label: "Reports",
					items: [{ id: "rep", label: "Weekly", icon: FileText, path: "/app/reports/weekly" }],
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
	const rootModules: NavModule[] = [
		{
			id: "home",
			label: "Home",
			icon: Home,
			basePath: "/",
			items: [
				{ id: "root", label: "Overview", icon: Home, path: "/" },
				{ id: "reports", label: "Reports", icon: FileText, path: "/reports" },
			],
		},
		modules[1],
	];
	const mods = $derived(root ? rootModules : single ? singleModules : modules);
</script>

{#if full}
	<AppShellLayout modules={mods} {pathname} {onNavigate} persistPanel={persist} mainId={ownMain ? null : mainId}>
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
		{#if ownMain}
			<main id="main" tabindex="-1">
				<h1>Page content</h1>
			</main>
		{:else}
			<h1>Page content</h1>
		{/if}
	</AppShellLayout>
{:else}
	<AppShellLayout modules={mods} {pathname} {onNavigate} persistPanel={persist} mainId={ownMain ? null : mainId}>
		{#if ownMain}
			<main id="main" tabindex="-1">
				<h1>Page content</h1>
			</main>
		{:else}
			<h1>Page content</h1>
		{/if}
	</AppShellLayout>
{/if}
