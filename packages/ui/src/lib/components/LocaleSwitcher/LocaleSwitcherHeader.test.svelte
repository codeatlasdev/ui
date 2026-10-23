<script lang="ts">
	import Button from "../Button/Button.svelte";
	import SiteHeader from "../SiteHeader/SiteHeader.svelte";
	import LocaleSwitcher from "./LocaleSwitcher.svelte";

	let value = $state("pt-BR");
	const options = [
		{ value: "pt-BR", label: "Português", short: "PT" },
		{ value: "en", label: "English" },
	];
</script>

<SiteHeader>
	{#snippet trailing()}
		<LocaleSwitcher {options} bind:value />
		<Button size="sm" href="/signup">Sign up</Button>
	{/snippet}
</SiteHeader>
