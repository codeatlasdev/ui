<script lang="ts">
	import LoadingBoundary from "./LoadingBoundary.svelte";
	import Content from "./LoadingBoundaryContent.test.svelte";

	interface Props {
		delay?: number;
		minDuration?: number;
		withPending?: boolean;
		label?: string;
	}
	let { delay, minDuration, withPending = false, label }: Props = $props();

	// The test owns the promise: `release()` resolves what the boundary is waiting for.
	let resolve: (v: string) => void = () => {};
	const promise = new Promise<string>((r) => {
		resolve = r;
	});
	export function release() {
		resolve("Loaded");
	}
</script>

{#if withPending}
	<LoadingBoundary {delay} {minDuration} {label}>
		{#snippet pending()}<p data-testid="custom-pending">Custom pending</p>{/snippet}
		<Content {promise} />
	</LoadingBoundary>
{:else}
	<LoadingBoundary {delay} {minDuration} {label}>
		<Content {promise} />
	</LoadingBoundary>
{/if}
