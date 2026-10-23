<script lang="ts">
	import { Bell, Home, Inbox, Map as MapIcon, Search, Settings, Users } from "@lucide/svelte";
	import AppShellLayout from "./AppShellLayout.svelte";
	import NavMoreSheet from "./NavMoreSheet.svelte";
	import type { NavModule } from "./types.js";

	interface Props {
		pathname?: string;
		/** Hide modules whose id is listed (what a role filter does). */
		hidden?: string[];
		/** Module count: 4 fits the bottom nav, 7 overflows into "More". */
		count?: number;
		onNavigate?: (path: string) => void;
		railLabels?: boolean;
		bottomNavPrimary?: number;
		withOverflow?: boolean;
		/** "default": no prop passed (built-in More dialog); "sheet": the opt-in Sheet (NavMoreSheet). */
		sheet?: "default" | "sheet";
		withTop?: boolean;
	}

	let {
		pathname = "/inbox/all",
		hidden = [],
		count = 4,
		onNavigate,
		railLabels = false,
		bottomNavPrimary,
		withOverflow = false,
		sheet = "sheet",
		withTop = false,
	}: Props = $props();

	const all: NavModule[] = [
		{
			id: "inbox",
			label: "Inbox",
			icon: Inbox,
			basePath: "/inbox",
			badge: 12,
			items: [
				{ id: "all", label: "All", icon: Inbox, path: "/inbox/all" },
				{ id: "sent", label: "Sent", icon: Inbox, path: "/inbox/sent" },
			],
		},
		{
			id: "map",
			label: "Map",
			icon: MapIcon,
			basePath: "/map",
			badge: "dot",
			badgeLabel: "Search running",
			items: [
				{ id: "live", label: "Live", icon: MapIcon, path: "/map/live" },
				{ id: "saved", label: "Saved", icon: MapIcon, path: "/map/saved" },
			],
		},
		{
			id: "people",
			label: "People",
			icon: Users,
			basePath: "/people",
			badge: 3,
			badgeLabel: "3 tasks pending",
			items: [{ id: "all", label: "Directory", icon: Users, path: "/people/all" }],
		},
		{
			id: "settings",
			label: "Settings",
			icon: Settings,
			basePath: "/settings",
			items: [{ id: "gen", label: "General", icon: Settings, path: "/settings/general" }],
		},
		{
			id: "alerts",
			label: "Alerts",
			icon: Bell,
			basePath: "/alerts",
			items: [{ id: "a", label: "Rules", icon: Bell, path: "/alerts/rules" }],
		},
		{
			id: "search",
			label: "Search",
			icon: Search,
			basePath: "/search",
			items: [{ id: "s", label: "Saved", icon: Search, path: "/search/saved" }],
		},
		{
			id: "home",
			label: "Home",
			icon: Home,
			basePath: "/home",
			items: [{ id: "h", label: "Start", icon: Home, path: "/home/start" }],
		},
	];

	const modules = $derived(all.slice(0, count));
</script>

<AppShellLayout
	{modules}
	{pathname}
	{onNavigate}
	{railLabels}
	{bottomNavPrimary}
	moreSheet={sheet === "sheet" ? NavMoreSheet : undefined}
	filterModules={(m) => !hidden.includes(m.id)}
	persistPanel={false}
>
	{#snippet railTop()}
		{#if withTop}<button type="button" class="top-slot">Search ⌘K</button>{/if}
	{/snippet}
	{#snippet bottomNavOverflow()}
		{#if withOverflow}<button type="button" class="more-slot">Account</button>{/if}
	{/snippet}
	<h1>Page content</h1>
</AppShellLayout>
