<script lang="ts">
	import { Home, FileText, Users, Wallet } from "@lucide/svelte";
	import AppShellLayout from "./AppShellLayout.svelte";
	import type { NavModule } from "./types.js";

	interface Props {
		pathname?: string;
		persist?: boolean;
		sectionsDefaultOpen?: boolean;
	}

	let { pathname: initial = "/crm", persist = false, sectionsDefaultOpen }: Props = $props();

	// Two modules with a section of the same label at the same position (#1173).
	const modules: NavModule[] = [
		{
			id: "crm",
			label: "CRM",
			icon: Users,
			basePath: "/crm",
			items: [
				{ id: "crm-home", label: "Pipeline", icon: Home, path: "/crm" },
				{
					label: "Cadastros",
					items: [
						{ id: "cli", label: "Clientes", icon: Users, path: "/crm/clientes" },
						{ id: "con", label: "Contatos", icon: Users, path: "/crm/contatos" },
					],
				},
				{
					label: "Reports",
					defaultOpen: true,
					items: [{ id: "rep", label: "Weekly", icon: FileText, path: "/crm/reports" }],
				},
			],
		},
		{
			id: "fin",
			label: "Finance",
			icon: Wallet,
			basePath: "/fin",
			items: [
				{ id: "fin-home", label: "Overview", icon: Home, path: "/fin" },
				{
					label: "Cadastros",
					items: [
						{ id: "acc", label: "Contas", icon: Wallet, path: "/fin/contas" },
						{ id: "bank", label: "Bancos", icon: Wallet, path: "/fin/bancos" },
					],
				},
			],
		},
	];

	// svelte-ignore state_referenced_locally
	let pathname = $state(initial);
	/** What a router does: the URL changes, the layout stays. */
	export function go(path: string) {
		pathname = path;
	}
</script>

<AppShellLayout {modules} {pathname} onNavigate={go} persistPanel={persist} {sectionsDefaultOpen}>
	<h1>{pathname}</h1>
</AppShellLayout>
