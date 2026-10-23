<script lang="ts">
	import Button from "../Button/Button.svelte";
	import LocaleSwitcher from "../LocaleSwitcher/LocaleSwitcher.svelte";
	import NavigationMenu from "../NavigationMenu/NavigationMenu.svelte";
	import NavigationMenuLink from "../NavigationMenu/NavigationMenuLink.svelte";
	import SiteHeader from "./SiteHeader.svelte";

	let value = $state("en");
	const options = [
		{ value: "en", label: "English" },
		{ value: "pt-BR", label: "Português", short: "PT" },
	];
</script>

<SiteHeader>
	{#snippet trailing()}
		<NavigationMenu aria-label="Primary">
			<NavigationMenuLink href="#features">Features</NavigationMenuLink>
			<NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
			<NavigationMenuLink href="#faq">FAQ</NavigationMenuLink>
		</NavigationMenu>
		<LocaleSwitcher {options} bind:value />
		<Button variant="ghost" size="sm" tone="neutral" href="/sign-in">Sign in</Button>
		<Button variant="filled" size="sm" href="/sign-up">Get started</Button>
	{/snippet}
</SiteHeader>
