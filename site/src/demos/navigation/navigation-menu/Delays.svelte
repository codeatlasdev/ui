<script lang="ts">
  import { NavigationMenu, NavigationMenuItem, NavigationMenuLink } from '@codeatlasdev/ui';
</script>

<NavigationMenu aria-label="Docs sections" openDelay={0} closeDelay={400}>
  <NavigationMenuItem label="Guides" align="start">
    <NavigationMenuLink href="#start">Getting started</NavigationMenuLink>
    <NavigationMenuLink href="#theming">Theming</NavigationMenuLink>
  </NavigationMenuItem>
  <NavigationMenuItem label="Reference" align="end">
    <NavigationMenuLink href="#components">Components</NavigationMenuLink>
    <NavigationMenuLink href="#tokens">Tokens</NavigationMenuLink>
  </NavigationMenuItem>
</NavigationMenu>
