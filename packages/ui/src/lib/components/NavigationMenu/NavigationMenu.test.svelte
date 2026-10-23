<script lang="ts">
	import NavigationMenu from "./NavigationMenu.svelte";
	import NavigationMenuItem from "./NavigationMenuItem.svelte";
	import NavigationMenuLink from "./NavigationMenuLink.svelte";

	interface Props {
		openDelay?: number;
		closeDelay?: number;
	}
	let { openDelay = 0, closeDelay = 0 }: Props = $props();
</script>

<a href="#skip">Skip</a>
<NavigationMenu aria-label="Main" {openDelay} {closeDelay}>
	<NavigationMenuItem label="Products">
		<NavigationMenuLink href="#analytics" description="Dashboards and reports">Analytics</NavigationMenuLink>
		<NavigationMenuLink href="#automation">Automation</NavigationMenuLink>
	</NavigationMenuItem>
	<NavigationMenuItem label="Resources">
		<NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
		<NavigationMenuLink href="#blog">Blog</NavigationMenuLink>
	</NavigationMenuItem>
	<NavigationMenuLink href="#pricing" current>Pricing</NavigationMenuLink>
</NavigationMenu>
<button type="button">After</button>
