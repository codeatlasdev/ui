<script lang="ts">
	import MessageBubble from "./MessageBubble.svelte";

	type Reaction = { emoji: string; count?: number; mine?: boolean };
	interface Props {
		direction?: "in" | "out";
		grouped?: "single" | "first" | "middle" | "last";
		sender?: string;
		withAvatar?: boolean;
		withQuote?: boolean;
		withFooter?: boolean;
		reactions?: Reaction[];
		time?: string;
		status?: "pending" | "sent" | "delivered" | "read";
	}
	let {
		direction = "in",
		grouped = "single",
		sender,
		withAvatar = false,
		withQuote = false,
		withFooter = false,
		reactions,
		time,
		status,
	}: Props = $props();
</script>

<MessageBubble {direction} {grouped} {sender} {reactions} {time} {status}>
	{#snippet avatar()}{#if withAvatar}<span data-testid="avatar">AB</span>{/if}{/snippet}
	{#snippet quote()}{#if withQuote}<span data-testid="quote">Earlier text</span>{/if}{/snippet}
	{#snippet footer()}{#if withFooter}<span data-testid="footer">edited</span>{/if}{/snippet}
	Hello there
</MessageBubble>
