<script lang="ts">
	import { setContext } from "svelte";
	import SiteHeader from "./SiteHeader.svelte";

	interface Props {
		pathname?: string;
		onToggle?: () => void;
		panelOpen?: boolean;
		display?: boolean;
	}

	let { pathname = "/painel/usuarios/novo-cadastro", onToggle, panelOpen = true, display = false }: Props = $props();

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

<SiteHeader {display} />
