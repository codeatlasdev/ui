<script lang="ts">
	import Button from "../Button/Button.svelte";
	import PageShell from "./PageShell.svelte";

	let {
		primary = true,
		clicked = [],
		manyActions = false,
		title = "Atendimento ao cliente — fila prioritária",
		width = "100vw",
	}: { primary?: boolean; clicked?: string[]; manyActions?: boolean; title?: string; width?: string } = $props();
</script>

<div
	data-testid="host"
	style="display:flex;flex-direction:column;width:{width};height:100vh;overflow:hidden"
>
	<PageShell {title} description="Fila de hoje.">
		{#snippet actions()}
			<Button onclick={() => clicked.push("export")}>Exportar</Button>
			<Button onclick={() => clicked.push("import")}>Importar</Button>
			<Button
				variant="filled"
				data-priority={primary ? "primary" : undefined}
				onclick={() => clicked.push("new")}>Novo</Button
			>
			{#if manyActions}
				{#each ["Duplicar fila", "Arquivar fila", "Compartilhar fila", "Configurar fila"] as label}
					<Button>{label}</Button>
				{/each}
			{/if}
		{/snippet}
		<p>Body</p>
	</PageShell>
</div>
