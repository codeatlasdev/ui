<script lang="ts">
  // The one top bar of the site, for pages that are not a docs frame (landing, /templates/).
  // The docs frame (SiteDocsShell) renders the same DocsHeader with the same brand and actions,
  // so the header never changes between pages.
  import { DocsHeader, type DocsSection } from '@codeatlasdev/ui';
  import SiteBrand from './SiteBrand.svelte';
  import SiteActions from './SiteActions.svelte';
  import { siteHeader } from './site-header';

  interface Props {
    sections: DocsSection[];
    active?: string;
    pathname: string;
  }
  let { sections, active, pathname }: Props = $props();
</script>

<DocsHeader {sections} {active} {pathname} {...siteHeader} onnavigate={(href) => location.assign(href)}>
  {#snippet brand()}<SiteBrand />{/snippet}
  {#snippet actions()}<SiteActions />{/snippet}
</DocsHeader>
