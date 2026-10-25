<script lang="ts">
  // The components that suit the style, live, inside the style. Only in-flow components are shown:
  // overlays (Dialog, Drawer, Tooltip, CommandPalette) portal to <body>, outside the page island,
  // so a specimen of them here would not wear the recipe.
  import {
    Accordion,
    AccordionItem,
    Alert,
    Badge,
    Breadcrumb,
    Button,
    Callout,
    Card,
    Heading,
    Highlight,
    Kbd,
    SimpleTable,
    TabsContent,
    TabsList,
    TabsTrigger,
    Tabs,
    TextField,
  } from '@codeatlasdev/ui';
  import { CodeSnippet } from '@codeatlasdev/ui/code';

  interface Props {
    /** Component names from the style's `fits`, in order. */
    names: string[];
  }
  let { names }: Props = $props();

  let tab = $state('overview');
  let field = $state('');
</script>

<div class="fits">
  {#each names as name (name)}
    <section class="fits__item" aria-labelledby="fit-{name}">
      <h3 id="fit-{name}" class="fits__name">{name}</h3>
      <div class="fits__stage">
        {#if name === 'Button'}
          <div class="fits__row">
            <Button>Primary</Button>
            <Button variant="outlined">Secondary</Button>
            <Button variant="ghost">Quiet</Button>
            <Button variant="destructive">Delete</Button>
          </div>
        {:else if name === 'Card'}
          <Card title="Field notes" headingLevel={4} gap="sm" elevation={3}>
            <p class="fits__p">A card is a surface with a title and room to breathe.</p>
            <Button size="sm">Open</Button>
          </Card>
        {:else if name === 'Badge'}
          <div class="fits__row">
            <Badge tone="brand">New</Badge>
            <Badge tone="success" subtle dot>Active</Badge>
            <Badge tone="warning" subtle dot>Pending</Badge>
            <Badge tone="danger" subtle dot>Overdue</Badge>
          </div>
        {:else if name === 'Alert'}
          <Alert severity="warning" title="Check this">The export has two empty columns.</Alert>
        {:else if name === 'Callout'}
          <Callout type="note" title="Margin note">A callout reads as a note set beside the text.</Callout>
        {:else if name === 'Heading'}
          <Heading level={3} size="display-3">A headline that reads the display face</Heading>
        {:else if name === 'Highlight'}
          <p class="fits__p">Emphasis belongs on <Highlight>the words that matter</Highlight>, once or twice a page.</p>
        {:else if name === 'Kbd'}
          <p class="fits__p">Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to search, <Kbd>Esc</Kbd> to close.</p>
        {:else if name === 'Breadcrumb'}
          <Breadcrumb items={[{ label: 'Docs', href: '/docs/' }, { label: 'Surfaces', href: '/docs/surfaces/' }, { label: 'Card' }]} />
        {:else if name === 'Tabs'}
          <Tabs bind:value={tab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview"><p class="fits__p">Overview content.</p></TabsContent>
            <TabsContent value="activity"><p class="fits__p">Activity content.</p></TabsContent>
            <TabsContent value="settings"><p class="fits__p">Settings content.</p></TabsContent>
          </Tabs>
        {:else if name === 'Accordion'}
          <Accordion type="single">
            <AccordionItem value="a" title="What is in the box?">The recipe, the components and the prompt.</AccordionItem>
            <AccordionItem value="b" title="Can I change it?">Yes: override any knob on top of the recipe.</AccordionItem>
          </Accordion>
        {:else if name === 'TextField'}
          <TextField label="Search" placeholder="Type a name" bind:value={field} description="Square, outlined, labelled." />
        {:else if name === 'CodeSnippet'}
          <CodeSnippet language="ts" code={'export const theme = designStyle("terminal");'} />
        {:else if name === 'SimpleTable'}
          <Card flush full>
            <SimpleTable>
              <thead><tr><th>Service</th><th>Region</th><th>Latency</th></tr></thead>
              <tbody>
                <tr><td class="primary">api</td><td>eu-1</td><td>42 ms</td></tr>
                <tr><td class="primary">worker</td><td>us-2</td><td>118 ms</td></tr>
                <tr><td class="primary">search</td><td>eu-1</td><td>67 ms</td></tr>
              </tbody>
            </SimpleTable>
          </Card>
        {/if}
      </div>
    </section>
  {/each}
</div>

<style>
  .fits { display: grid; gap: var(--ca-space-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); min-inline-size: 0; }
  .fits__item { display: grid; gap: var(--ca-space-2); min-inline-size: 0; align-content: start; }
  .fits__name { margin: 0; font-family: var(--ca-font-mono); font-size: var(--ca-font-size-caption); font-weight: var(--ca-font-weight-medium); color: var(--ca-text-secondary); text-transform: none; letter-spacing: 0; }
  .fits__stage { min-inline-size: 0; }
  .fits__row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-3); }
  .fits__p { margin: 0; color: var(--ca-text-body); }
</style>
