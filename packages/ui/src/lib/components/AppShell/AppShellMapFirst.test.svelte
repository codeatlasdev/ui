<script lang="ts">
	import { Home, Inbox, Settings } from "@lucide/svelte";
	import PageFrame from "../PageFrame/PageFrame.svelte";
	import AppShellLayout from "./AppShellLayout.svelte";
	import type { NavModule } from "./types.js";

	interface Props {
		railWidth?: number;
		mobileHeader?: boolean;
		railSeparators?: boolean;
		railLabels?: boolean;
		frame?: boolean;
		stage?: boolean;
		withBottom?: boolean;
		headerBorder?: boolean;
	}
	let { railWidth, mobileHeader, railSeparators, railLabels = false, frame = false, stage = false, withBottom = false, headerBorder = false }: Props = $props();

	const modules: NavModule[] = [
		{
			id: "inbox",
			label: "Inbox",
			icon: Inbox,
			basePath: "/inbox",
			badge: 4,
			badgeTone: "error",
			items: [
				{ id: "a", label: "All", icon: Inbox, path: "/inbox/a" },
				{ id: "b", label: "Sent", icon: Inbox, path: "/inbox/b" },
				{ id: "c", label: "Drafts", icon: Inbox, path: "/inbox/c" },
			],
		},
		{ id: "home", label: "Home", icon: Home, basePath: "/home", badge: 2, badgeTone: "brand", items: [{ id: "h", label: "Start", icon: Home, path: "/home/s" }] },
		{ id: "cfg", label: "Settings", icon: Settings, basePath: "/settings", badge: 1, items: [{ id: "g", label: "General", icon: Settings, path: "/settings/g" }] },
	];
</script>

<AppShellLayout
	{modules}
	pathname="/inbox/a"
	persistPanel={false}
	{railWidth}
	{mobileHeader}
	{railSeparators}
	{railLabels}
	skipLink={false}
	stage={stage ? stageSnippet : undefined}
>
	{#snippet railBottom()}
		{#if withBottom}<button type="button">Account</button>{/if}
	{/snippet}
	{#if frame}
		<PageFrame label="Frame" width="sm" {headerBorder}>
			{#snippet header()}<h2>Title</h2>{/snippet}
			{#snippet toolbar()}<input aria-label="Search" />{/snippet}
			{#snippet footer()}<button type="button">Save</button>{/snippet}
			<p>Body</p>
		</PageFrame>
	{:else}
		<h1>Page</h1>
	{/if}
</AppShellLayout>

{#snippet stageSnippet()}
	<div data-testid="stage" style="position:absolute;inset:0"></div>
{/snippet}
