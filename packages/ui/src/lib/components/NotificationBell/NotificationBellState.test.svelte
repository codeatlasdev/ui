<script lang="ts">
	import NotificationBell, { type NotificationItem } from "./NotificationBell.svelte";

	interface Props {
		items?: NotificationItem[];
		open?: boolean;
		count?: number;
		loading?: boolean;
		lazy?: boolean;
		onOpenChange?: (open: boolean) => void;
		onReadAll?: () => void;
	}
	let {
		items = [], open = $bindable(false), count, loading = false, lazy = false,
		onOpenChange, onReadAll,
	}: Props = $props();
</script>

<button type="button">Outside</button>
<NotificationBell
	notifications={items}
	bind:open
	{count}
	{loading}
	onOpenChange={(next) => {
		if (lazy && next) loading = true;
		onOpenChange?.(next);
	}}
	onReadAll={() => {
		if (lazy) count = 0;
		onReadAll?.();
	}}
/>
<output aria-label="Bound open">{open ? "open" : "closed"}</output>
