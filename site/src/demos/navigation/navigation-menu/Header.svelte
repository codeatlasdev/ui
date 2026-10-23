<script lang="ts">
  import { NavigationMenu, NavigationMenuItem, NavigationMenuLink } from '@codeatlasdev/ui';
</script>

<NavigationMenu aria-label="Main">
  <NavigationMenuItem label="Products">
    <NavigationMenuLink href="#analytics" description="Dashboards and scheduled reports">Analytics</NavigationMenuLink>
    <NavigationMenuLink href="#automation" description="Rules that run on events">Automation</NavigationMenuLink>
    <NavigationMenuLink href="#integrations" description="Connect the tools you already use">Integrations</NavigationMenuLink>
  </NavigationMenuItem>
  <NavigationMenuItem label="Resources">
    <NavigationMenuLink href="#docs">Documentation</NavigationMenuLink>
    <NavigationMenuLink href="#guides">Guides</NavigationMenuLink>
    <NavigationMenuLink href="#changelog">Changelog</NavigationMenuLink>
  </NavigationMenuItem>
  <NavigationMenuLink href="#pricing" current>Pricing</NavigationMenuLink>
  <NavigationMenuLink href="#contact">Contact</NavigationMenuLink>
</NavigationMenu>
