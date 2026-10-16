<script lang="ts">
	import { onMount } from "svelte";
	import InstallPrompt from "./InstallPrompt.svelte";

	// The native variant arms its Install button from a real `beforeinstallprompt`; fire a fake one.
	onMount(() => {
		const event = new Event("beforeinstallprompt", { cancelable: true });
		Object.assign(event, {
			prompt: () => Promise.resolve(),
			userChoice: Promise.resolve({ outcome: "dismissed" }),
		});
		dispatchEvent(event);
	});
</script>

<div data-testid="matrix" class="matrix">
	<InstallPrompt mode="native" storageKey="vrt-native" />
	<InstallPrompt mode="ios" storageKey="vrt-ios" />
</div>

<style>
	.matrix {
		display: grid;
		gap: var(--ca-space-4);
		padding: var(--ca-space-4);
		width: 480px;
	}
</style>
