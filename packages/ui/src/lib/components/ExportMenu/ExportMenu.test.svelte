<script lang="ts">
	import ExportMenu from "./ExportMenu.svelte";
	interface Props {
		data?: Record<string, unknown>[];
		formats?: ("csv" | "json")[];
		onexport?: (e: { format: "csv" | "json"; filename: string; content: string; rows: number }) => void;
	}
	let {
		data = [
			{ domain: "a.com", price: 12 },
			{ domain: "b.com", price: 8 },
		],
		formats,
		onexport,
	}: Props = $props();
</script>

<main>
	<ExportMenu {data} filename="results" {formats} {onexport} />
</main>
