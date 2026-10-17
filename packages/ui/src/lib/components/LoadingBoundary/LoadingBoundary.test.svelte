<script lang="ts">
	import LoadingBoundary from "./LoadingBoundary.svelte";
	import Content from "./LoadingBoundaryContent.test.svelte";

	interface Props {
		delay?: number;
		minDuration?: number;
		withPending?: boolean;
		label?: string;
		/** Stamp the custom placeholder's mount/unmount times (ms, performance.now). */
		stamps?: { mounted?: number; unmounted?: number };
		/** Block the thread this long (ms) while the placeholder renders: a busy main thread. */
		stall?: number;
	}
	let { delay, minDuration, withPending = false, label, stamps, stall = 0 }: Props = $props();

	function slow() {
		const t0 = performance.now();
		while (performance.now() - t0 < stall);
		return "Custom pending";
	}

	function stamp(_node: HTMLElement) {
		if (stamps) stamps.mounted = performance.now();
		return () => {
			if (stamps) stamps.unmounted = performance.now();
		};
	}

	// The test owns the promise: `release()` resolves what the boundary is waiting for.
	let resolve: (v: string) => void = () => {};
	const promise = new Promise<string>((r) => {
		resolve = r;
	});
	export function release() {
		resolve("Loaded");
	}
</script>

{#if withPending || stamps}
	<LoadingBoundary {delay} {minDuration} {label}>
		{#snippet pending()}<p data-testid="custom-pending" {@attach stamp}>{slow()}</p>{/snippet}
		<Content {promise} />
	</LoadingBoundary>
{:else}
	<LoadingBoundary {delay} {minDuration} {label}>
		<Content {promise} />
	</LoadingBoundary>
{/if}
