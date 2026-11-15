<script lang="ts">
	import { setContext } from "svelte";
	import SiteHeader from "./SiteHeader.svelte";

	interface Props {
		pathname?: string;
		onToggle?: () => void;
		panelOpen?: boolean;
		display?: boolean;
		labels?: Record<string, string>;
		resolveSegment?: (segment: string, index: number, segments: string[]) => string | undefined;
		/** Renders a trailing button with this text. */
		action?: string;
	}

	let {
		pathname = "/painel/usuarios/novo-cadastro",
		onToggle,
		panelOpen = true,
		display = false,
		labels,
		resolveSegment,
		action,
	}: Props = $props();

	setContext("appshell", {
		get panelOpen() {
			return panelOpen;
		},
		get pathname() {
			return pathname;
		},
		setPanelOpen: () => {},
		togglePanel: () => onToggle?.(),
		navigate: () => {},
	});
</script>

{#if action}
	<SiteHeader {display} {labels} {resolveSegment}>
		{#snippet trailing()}
			<button type="button">{action}</button>
		{/snippet}
	</SiteHeader>
{:else}
	<SiteHeader {display} {labels} {resolveSegment} />
{/if}
