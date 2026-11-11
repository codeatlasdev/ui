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
		status?: "pending" | "sent" | "delivered" | "read" | "failed";
		withRetry?: boolean;
		onretry?: () => void;
		onquoteclick?: () => void;
		quoteLabel?: string;
		text?: string;
		/** Host the bubble in a shrinking flex item (column list, start-aligned), as a chat list does. */
		shrink?: boolean;
		wideFooter?: boolean;
		/** Size the host by min-content: the width a bubble gets when a list squeezes its row. */
		minContent?: boolean;
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
		withRetry = false,
		onretry,
		onquoteclick,
		quoteLabel,
		text = "Hello there",
		shrink = false,
		wideFooter = false,
		minContent = false,
	}: Props = $props();
</script>

{#snippet retryLabel()}Retry sending{/snippet}
{#snippet bubble()}
	<MessageBubble retry={withRetry ? retryLabel : undefined} {direction} {grouped} {sender} {reactions} {time} {status} {onretry} {onquoteclick} {quoteLabel}>
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
	<div style="display:flex;flex-direction:column;align-items:flex-start;inline-size:{wideFooter ? '9rem' : '20rem'}">
		<div style="flex:0 1 auto;min-inline-size:0;max-inline-size:min(100%,65ch);inline-size:{minContent ? 'min-content' : 'auto'}">
			{@render bubble()}
		</div>
	</div>
{:else}
	{@render bubble()}
{/if}
