<script lang="ts">
	import { createRawSnippet } from "svelte";
	import { Mail } from "@lucide/svelte";
	import NotificationBell, { type NotificationItem } from "./NotificationBell.svelte";

	interface Props {
		items?: NotificationItem[];
		side?: "top" | "right" | "bottom" | "left";
		align?: "start" | "center" | "end";
		sideOffset?: number;
		width?: string;
		max?: number;
		count?: number;
		loading?: boolean;
		error?: { onRetry?: () => void; message?: string };
		withEmptyContent?: boolean;
		withItem?: boolean;
		withIcons?: boolean;
		rail?: boolean;
		onRead?: (id: string) => void;
		onClear?: () => void;
		onReadAll?: () => void;
	}
	let {
		items = [], withEmptyContent = false, withItem = false, withIcons = false, rail = false, ...rest
	}: Props = $props();

	const emptyContent = createRawSnippet(() => ({
		render: () => `<p data-testid="custom-empty">All caught up</p>`,
	}));
	const list = $derived(withIcons ? items.map((n) => ({ ...n, icon: Mail })) : items);
</script>

{#snippet custom(n: NotificationItem, ctl: { close: () => void; markRead: () => void })}
	<div data-testid="custom-row-{n.id}">
		<span>{n.title}</span>
		<button type="button" onclick={ctl.markRead}>custom-read</button>
		<button type="button" onclick={ctl.close}>custom-close</button>
	</div>
{/snippet}

<div style={rail ? "position:fixed;left:0;bottom:0;top:0;width:64px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:16px" : ""}>
	{#if withItem}
		<NotificationBell notifications={list} {...rest} item={custom} emptyContent={withEmptyContent ? emptyContent : undefined} />
	{:else}
		<NotificationBell notifications={list} {...rest} emptyContent={withEmptyContent ? emptyContent : undefined} />
	{/if}
</div>
