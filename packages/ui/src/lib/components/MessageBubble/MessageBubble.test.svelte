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
		text?: string;
		/** Host the bubble in a shrinking flex item, as a chat list does. */
		shrink?: boolean;
		wideFooter?: boolean;
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
		text = "Hello there",
		shrink = false,
		wideFooter = false,
	}: Props = $props();
</script>

{#snippet bubble()}
	<MessageBubble {direction} {grouped} {sender} {reactions} {time} {status}>
		{#snippet avatar()}{#if withAvatar}<span data-testid="avatar">AB</span>{/if}{/snippet}
		{#snippet quote()}{#if withQuote}<span data-testid="quote">Earlier text</span>{/if}{/snippet}
		{#snippet footer()}
			{#if wideFooter}
				<span data-testid="footer">Ana Souza Backoffice</span><span>Not sent</span>
			{:else if withFooter}
				<span data-testid="footer">edited</span>
			{/if}
		{/snippet}
		{text}
	</MessageBubble>
{/snippet}

{#if shrink}
	<div style="display:flex;inline-size:{wideFooter ? '9rem' : '20rem'}">
		<div style="flex:0 1 auto;min-inline-size:0;max-inline-size:min(100%,65ch)">
			{@render bubble()}
		</div>
	</div>
{:else}
	{@render bubble()}
{/if}
