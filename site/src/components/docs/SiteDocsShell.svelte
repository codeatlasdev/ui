<script lang="ts">
  // Island wrapper: DocsShell needs a brand snippet and a navigate callback, which
  // cannot cross the Astro → island boundary. Everything else arrives as plain props.
  import {
    DocsShell,
    type DocsHeading,
    type DocsNavGroup,
    type DocsPagerLink,
    type DocsSearchEntry,
    type DocsSection,
  } from '@codeatlasdev/ui';
  import type { Snippet } from 'svelte';
  import Logo from '../Logo.svelte';

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

  const searchIndex = (): Promise<DocsSearchEntry[]> => fetch('/search-index.json').then((r) => r.json());
</script>

<DocsShell
  {sections}
  {active}
  {groups}
  {pathname}
  {headings}
  {pager}
  {searchIndex}
  onnavigate={(href) => location.assign(href)}
  brandLabel="CodeAtlas UI home"
>
  {#snippet brand()}<Logo /> <span>CodeAtlas UI</span>{/snippet}
  {#snippet actions()}
    <a href="https://github.com/codeatlasdev/ui" aria-label="GitHub repository">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg>
    </a>
  {/snippet}
  {@render children()}
</DocsShell>
