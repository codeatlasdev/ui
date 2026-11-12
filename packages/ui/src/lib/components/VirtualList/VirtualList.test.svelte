<script lang="ts">
	import VirtualList from "./VirtualList.svelte";

	interface Row {
		id: number;
		lines: number;
	}
	interface Props {
		initial?: number;
		hasMore?: boolean;
		loadingMore?: boolean;
		follow?: boolean;
		withEmpty?: boolean;
		height?: string;
		bordered?: boolean;
		onloadmore?: () => void | Promise<void>;
	}
	let { initial = 0, hasMore = false, loadingMore = false, follow = true, withEmpty = false, height = "320px", bordered, onloadmore }: Props = $props();

	// Variable heights (1 to 3 lines) so measured sizes differ from the estimate.
	const row = (id: number): Row => ({ id, lines: 1 + (Math.abs(id) % 3) });

	let items = $state<Row[]>([]);
	let seeded = false;
	$effect.pre(() => {
		if (seeded) return;
		seeded = true;
		items = Array.from({ length: initial }, (_, i) => row(i + 1));
	});

	let oldest = 1;
	let newest = 0;
	$effect.pre(() => {
		if (newest === 0) newest = initial;
	});

	export function append(n = 1) {
		const next = Array.from({ length: n }, () => row(++newest));
		items = [...items, ...next];
	}
	export function prepend(n = 1) {
		const older = Array.from({ length: n }, () => row(--oldest));
		items = [...older.reverse(), ...items];
	}
	/** Replaces the list with another one (ids `from` .. `from + n - 1`), like switching conversations. */
	export function swap(from: number, n: number) {
		items = Array.from({ length: n }, (_, i) => row(from + i));
	}
	let grown = $state(false);
	/** Grows the last row by 80px, like an image decoding or a link wrapping. */
	export function growLast() {
		grown = true;
	}
</script>

<VirtualList {items} getKey={(r) => r.id} label="Messages" {height} {bordered} {follow} {hasMore} {loadingMore} {onloadmore}>
	{#snippet item(r)}
		<div data-key={r.id} class="row" style="padding: 4px 8px{grown && r.id === items[items.length - 1]?.id ? '; padding-block-end: 84px' : ''}">
			<span>Message {r.id}</span>
			{#each { length: r.lines - 1 } as _}<br />{/each}
		</div>
	{/snippet}
	{#snippet empty()}
		{#if withEmpty}<span>Nothing yet</span>{/if}
	{/snippet}
</VirtualList>
