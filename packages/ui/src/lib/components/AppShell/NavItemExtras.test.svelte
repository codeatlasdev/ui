<script lang="ts">
	import { Archive, Folder, Star } from "@lucide/svelte";
	import { setContext } from "svelte";
	import DropdownMenuItem from "../DropdownMenu/DropdownMenuItem.svelte";
	import NavItemMenu from "./NavItemMenu.svelte";
	import NavReorder from "./NavReorder.svelte";
	import Panel from "./Panel.svelte";
	import type { NavExtras, NavModule } from "./types.js";

	// What AppShellLayout does with `reorder={NavReorder} itemMenu={NavItemMenu}`.
	setContext<NavExtras>("appshell-nav-extras", { reorder: NavReorder, itemMenu: NavItemMenu });

	interface Props {
		/** Section items start in this order; the test reads it back from the DOM. */
		reorder?: boolean;
		/** Records `from`/`to` of every drop. */
		drops?: { id: string; from: number; to: number }[];
		/** Records the `actions` menu choices. */
		picked?: string[];
		pathname?: string;
	}
	let { reorder = false, drops = [], picked = [], pathname = "/p/alpha" }: Props = $props();

	let order = $state(["alpha", "beta", "gamma"]);
	const labels: Record<string, string> = { alpha: "Alpha", beta: "Beta", gamma: "Gamma" };

	const modules: NavModule[] = $derived([
		{
			id: "p",
			label: "Projects",
			icon: Folder,
			basePath: "/p",
			items: [
				{
					label: "Mine",
					collapsible: false,
					onReorder: reorder
						? (e) => {
								drops.push({ id: e.id, from: e.from, to: e.to });
								const next = order.slice();
								next.splice(e.from, 1);
								next.splice(e.to, 0, e.id);
								order = next;
							}
						: undefined,
					items: order.map((id) => ({
						id,
						label: labels[id],
						icon: Folder,
						path: `/p/${id}`,
						color: id === "alpha" ? "#e11d48" : undefined,
						count: id === "beta" ? 1200 : id === "gamma" ? 0 : undefined,
						badge: id === "alpha" ? 3 : undefined,
						actions:
							id === "beta"
								? actionsMenu
								: undefined,
					})),
				},
				{
					id: "lead",
					label: "Custom leading",
					icon: Star,
					path: "/p/lead",
					leading: lead,
				},
			],
		},
		{ id: "x", label: "Other", icon: Archive, basePath: "/x", items: [] },
	]);
</script>

{#snippet lead()}
	<span data-testid="lead" class="lead-mark">L</span>
{/snippet}

{#snippet actionsMenu()}
	<DropdownMenuItem onclick={() => picked.push("favorite")}>Favorite</DropdownMenuItem>
	<DropdownMenuItem onclick={() => picked.push("archive")}>Archive</DropdownMenuItem>
{/snippet}

<Panel {modules} activeModuleIndex={0} {pathname} show={true} panelW={240} />
