<script lang="ts">
	import ConversationItem from "./ConversationItem.svelte";

	interface Props {
		title?: string;
		time?: string;
		preview?: string;
		withIcon?: boolean;
		withAvatar?: boolean;
		unread?: number;
		pinned?: boolean;
		muted?: boolean;
		active?: boolean;
		typing?: boolean;
		href?: string;
		clicks?: { n: number };
		withMeta?: boolean;
	}
	let {
		title = "Ana Souza",
		time,
		preview,
		withIcon = false,
		withAvatar = false,
		unread,
		pinned,
		muted,
		active,
		typing,
		href,
		clicks = { n: 0 },
		withMeta = false,
	}: Props = $props();
</script>

<ConversationItem
	{title}
	{time}
	{preview}
	{unread}
	{pinned}
	{muted}
	{active}
	{typing}
	{href}
	onclick={() => clicks.n++}
>
	{#snippet avatar()}{#if withAvatar}<span data-testid="avatar">AS</span>{/if}{/snippet}
	{#snippet previewIcon()}{#if withIcon}<span data-testid="ticks">ok</span>{/if}{/snippet}
	{#snippet meta()}{#if withMeta}<span data-testid="meta">Waiting for the team · Trial</span>{/if}{/snippet}
</ConversationItem>
