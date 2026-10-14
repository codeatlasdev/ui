<script lang="ts">
	import LiveList from "./LiveList.svelte";

	interface Props {
		initial?: number;
		total?: number;
		follow?: boolean;
		status?: "idle" | "running" | "done" | "error";
	}
	let { initial = 0, total, follow = true, status: initialStatus = "running" }: Props = $props();
	// Seeded once from the prop; `finish()` drives it afterwards.
	let status = $state((() => initialStatus)());

	export function finish(s: "done" | "error" = "done") {
		status = s;
	}

	let items = $state<{ id: number; label: string }[]>([]);
	let seeded = false;
	$effect.pre(() => {
		if (seeded) return;
		seeded = true;
		items = Array.from({ length: initial }, (_, i) => ({ id: i, label: `Row ${i + 1}` }));
	});

	export function push(n = 1) {
		const start = items.length;
		for (let i = 0; i < n; i++) items.push({ id: start + i, label: `Row ${start + i + 1}` });
	}
</script>

<main>
	<div data-testid="outside"><button type="button">Outside</button></div>
	<LiveList {items} {total} {follow} {status} label="Checks" height="200px">
		{#snippet item(row)}
			<span>{row.label}</span>
			<button type="button">Act {row.id}</button>
		{/snippet}
	</LiveList>
</main>
