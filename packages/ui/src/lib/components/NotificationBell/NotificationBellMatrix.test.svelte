<script lang="ts">
	import { createRawSnippet } from "svelte";
	import NotificationBell from "./NotificationBell.svelte";
	import type { NotificationItem } from "./NotificationBell.svelte";

	const notifications: NotificationItem[] = [
		{ id: "1", title: "Deploy completed", body: "Version 1.2.0 published.", time: "5 min ago", variant: "success" },
		{ id: "2", title: "Build failure", body: "Check the logs.", time: "1 h ago", variant: "error" },
		{ id: "3", title: "New comment", time: "yesterday", read: true },
	];
	const custom = createRawSnippet(() => ({
		render: () => `<span style="padding:6px 12px">Custom trigger</span>`,
	}));
</script>

<div data-testid="matrix" style="display:flex;gap:32px;align-items:center;padding:24px;width:max-content">
	<NotificationBell />
	<NotificationBell {notifications} />
	<NotificationBell notifications={notifications.map((n) => ({ ...n, read: true }))} />
	<NotificationBell notifications={Array.from({ length: 120 }, (_, i) => ({ id: String(i), title: `n${i}` }))} />
	<NotificationBell {notifications} children={custom} />
</div>
