<script lang="ts">
	// Mounted inside a stage iframe (the demo stage route or a template page): `ThemeIsland document`
	// mirrors the viewer's scheme and preset onto <html> for as long as the page lives, and the
	// viewer's theme messages update it. Without `?scheme=` in the URL it renders nothing, so a template
	// opened on its own keeps the visitor's theme. Nothing here touches localStorage.
	import { ThemeIsland } from "@codeatlasdev/ui";
	import { isStageMessage, readStageTheme, type StageTheme } from "./stage-protocol";

	const staged = typeof location !== "undefined" && new URLSearchParams(location.search).has("scheme");
	let theme = $state<StageTheme>(readStageTheme(typeof location === "undefined" ? "" : location.search, "dark"));

	$effect(() => {
		if (!staged) return;
		const onMessage = (e: MessageEvent) => {
			if (e.origin !== location.origin || !isStageMessage(e.data)) return;
			theme = { scheme: e.data.scheme, preset: e.data.preset };
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	});
</script>

<!-- Empty on purpose: `document` mirrors onto <html>, and a wrapper would change the page's own layout. -->
{#if staged}
	<ThemeIsland document scheme={theme.scheme} preset={theme.preset} class="stage-theme" />
{/if}

<style>
	/* The island only mirrors onto <html>; it holds no content and must not take viewport height. */
	:global(.stage-theme) {
		display: none;
	}
</style>
