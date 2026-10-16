<script lang="ts">
	import MediaGrid, { type MediaGridItem } from "./MediaGrid.svelte";

	interface Props {
		items?: MediaGridItem[];
		maxVisible?: number;
		columns?: 1 | 2 | 3;
		onopen?: (index: number, item: MediaGridItem) => void;
		ondownload?: (item: unknown, index: number) => void;
	}
	let { items = [], maxVisible, columns, onopen, ondownload }: Props = $props();
</script>

<MediaGrid {items} {maxVisible} {columns} {onopen} {ondownload} />
