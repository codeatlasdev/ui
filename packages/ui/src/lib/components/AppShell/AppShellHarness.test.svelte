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
			label: "Aplicativo",
			icon: Home,
			basePath: "/app",
			items: [
				{ id: "dash", label: "Painel", icon: Home, path: "/app/dashboard" },
				{ id: "docs", label: "Documentos", icon: FileText, path: "/app/docs", badge: 3 },
				{
					label: "Admin",
					items: [{ id: "usr", label: "Usuários", icon: Users, path: "/app/users" }],
				},
			],
		},
		{
			id: "cfg",
			label: "Ajustes",
			icon: Settings,
			basePath: "/settings",
			items: [
				{ id: "gen", label: "Geral", icon: Settings, path: "/settings/general" },
				{ id: "sec", label: "Segurança", icon: Settings, path: "/settings/security" },
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
			<span>Marca</span>
		{/snippet}
		{#snippet railBottom()}
			<button type="button">Conta</button>
		{/snippet}
		{#snippet mobileHeaderActions()}
			<button type="button">Ações</button>
		{/snippet}
		<main>
			<h1>Conteúdo da página</h1>
		</main>
	</AppShellLayout>
{:else}
	<AppShellLayout modules={mods} {pathname} {onNavigate} persistPanel={false} mainId={ownMain ? null : "main"}>
		{#if ownMain}
			<main id="main" tabindex="-1">
				<h1>Conteúdo da página</h1>
			</main>
		{:else}
			<main>
				<h1>Conteúdo da página</h1>
			</main>
		{/if}
	</AppShellLayout>
{/if}
