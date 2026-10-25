<script lang="ts">
  // Island wrapper: DocsShell needs a brand snippet and a navigate callback, which
  // cannot cross the Astro → island boundary. Everything else arrives as plain props.
  import {
    DocsShell,
    type DocsHeading,
    type DocsNavGroup,
    type DocsPagerLink,
    type DocsSection,
  } from '@codeatlasdev/ui';
  import type { Snippet } from 'svelte';
  import SiteActions from '../site/SiteActions.svelte';
  import SiteBrand from '../site/SiteBrand.svelte';
  import { siteHeader } from '../site/site-header';

  interface Props {
    sections: DocsSection[];
    active?: string;
    groups?: DocsNavGroup[];
    pathname: string;
    headings?: DocsHeading[];
    pager?: { prev?: DocsPagerLink; next?: DocsPagerLink };
    children: Snippet;
  }
  let { sections, active, groups = [], pathname, headings = [], pager, children }: Props = $props();
</script>

<DocsShell
  {sections}
  {active}
  {groups}
  {pathname}
  {headings}
  {pager}
  {...siteHeader}
  onnavigate={(href) => location.assign(href)}
>
  {#snippet brand()}<SiteBrand />{/snippet}
  {#snippet actions()}<SiteActions />{/snippet}
  {@render children()}
</DocsShell>
