<script lang="ts">
  import { createRawSnippet } from 'svelte';
  import DocsShell from './DocsShell.svelte';
  import CodeTabs from './CodeTabs.svelte';
  import CodeTab from './CodeTab.svelte';
  import Steps from './Steps.svelte';
  import Callout from './Callout.svelte';
  import CardGrid from './CardGrid.svelte';
  import LinkCard from './LinkCard.svelte';
  import type { DocsSearchEntry } from './types.js';

  let {
    kind,
    onnavigate = () => {},
    searchIndex,
    ...rest
  }: {
    kind: 'shell' | 'codetabs' | 'codetabs-pair' | 'steps' | 'callout' | 'cardgrid';
    onnavigate?: (href: string) => void;
    searchIndex?: DocsSearchEntry[] | (() => Promise<DocsSearchEntry[]>);
    [k: string]: unknown;
  } = $props();

  const index: DocsSearchEntry[] = [
    { href: '/guide/start', title: 'Getting started', section: 'Guide', description: 'Start here', headings: [{ text: 'Installation', id: 'installation' }], text: 'install the package' },
    { href: '/api/messages', title: 'Send message', section: 'API', description: 'Sending endpoint', headings: [], text: 'webhook and QR code' },
  ];

  const brand = createRawSnippet(() => ({ render: () => `<span>Atlas Docs</span>` }));
</script>

{#if kind === 'shell'}
  <DocsShell
    sections={[{ id: 'guide', label: 'Guide', href: '/guide' }, { id: 'api', label: 'API', href: '/api' }]}
    active="guide"
    groups={[{ label: 'Overview', items: [{ href: '/guide/start', title: 'Getting started' }, { href: '/guide/config', title: 'Configuration' }] }]}
    pathname="/guide/start"
    headings={[{ id: 'a', text: 'Introduction', depth: 2 }, { id: 'b', text: 'Installation', depth: 2 }]}
    searchIndex={searchIndex ?? index}
    {onnavigate}
    {brand}
    {...rest}
  >
    <article>
      <h2 id="a">Introduction</h2>
      <h2 id="b">Installation</h2>
    </article>
  </DocsShell>
{:else if kind === 'codetabs'}
  <CodeTabs {...rest}>
    <CodeTab label="cURL"><pre>curl https://api</pre></CodeTab>
    <CodeTab label="Node.js"><pre>fetch("https://api")</pre></CodeTab>
    <CodeTab label="Python"><pre>requests.get("https://api")</pre></CodeTab>
  </CodeTabs>
{:else if kind === 'codetabs-pair'}
  <CodeTabs sync="pair">
    <CodeTab label="cURL"><pre>curl A</pre></CodeTab>
    <CodeTab label="Node.js"><pre>node A</pre></CodeTab>
  </CodeTabs>
  <CodeTabs sync="pair">
    <CodeTab label="cURL"><pre>curl B</pre></CodeTab>
    <CodeTab label="Node.js"><pre>node B</pre></CodeTab>
  </CodeTabs>
{:else if kind === 'steps'}
  <Steps>
    <ol>
      <li><strong>Create a session</strong></li>
      <li><strong>Connect via QR code</strong></li>
    </ol>
  </Steps>
{:else if kind === 'callout'}
  <Callout {...rest}>Callout content</Callout>
{:else}
  <CardGrid>
    <LinkCard title="Guide" description="Start here" href="/guide" />
    <LinkCard title="API" href="/api" />
  </CardGrid>
{/if}
