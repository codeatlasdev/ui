<script lang="ts">
  import {
    Button,
    ButtonGroup,
    Carousel,
    CarouselItem,
    DropdownMenuItem,
    HoverCard,
    Menubar,
    MenubarMenu,
    ResizableHandle,
    ResizablePanel,
    ResizablePanels,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from '@codeatlasdev/ui';

  const slides = ['Plan', 'Build', 'Ship'];
  let range = $state('Week');
</script>

<Tabs value="carousel">
  <TabsList fade aria-label="New components">
    <TabsTrigger value="carousel">Carousel</TabsTrigger>
    <TabsTrigger value="panels">Panels</TabsTrigger>
    <TabsTrigger value="group">ButtonGroup</TabsTrigger>
    <TabsTrigger value="menubar">Menubar</TabsTrigger>
    <TabsTrigger value="hover">HoverCard</TabsTrigger>
  </TabsList>
  <TabsContent value="carousel">
    <div class="pane">
      <Carousel label="Release steps">
        {#each slides as s (s)}
          <CarouselItem><div class="slide">{s}</div></CarouselItem>
        {/each}
      </Carousel>
    </div>
  </TabsContent>
  <TabsContent value="panels">
    <div class="pane frame">
      <ResizablePanels label="Workspace">
        <ResizablePanel id="files" defaultSize={35} minSize={15}><p class="cell">Files</p></ResizablePanel>
        <ResizableHandle label="Resize files" />
        <ResizablePanel id="editor" defaultSize={65}><p class="cell">Editor</p></ResizablePanel>
      </ResizablePanels>
    </div>
  </TabsContent>
  <TabsContent value="group">
    <div class="pane">
      <ButtonGroup aria-label="Range">
        {#each ['Day', 'Week', 'Month'] as r (r)}
          <Button variant={range === r ? 'filled' : 'outlined'} tone="neutral" aria-pressed={range === r} onclick={() => (range = r)}>{r}</Button>
        {/each}
      </ButtonGroup>
    </div>
  </TabsContent>
  <TabsContent value="menubar">
    <div class="pane">
      <Menubar aria-label="Document">
        <MenubarMenu label="File">
          <DropdownMenuItem>New</DropdownMenuItem>
          <DropdownMenuItem>Open</DropdownMenuItem>
        </MenubarMenu>
        <MenubarMenu label="Edit">
          <DropdownMenuItem>Undo</DropdownMenuItem>
          <DropdownMenuItem>Redo</DropdownMenuItem>
        </MenubarMenu>
      </Menubar>
    </div>
  </TabsContent>
  <TabsContent value="hover">
    <div class="pane">
      <HoverCard openDelay={150}>
        {#snippet triggerChild(props)}<Button variant="outlined" {...props}>Hover or focus me</Button>{/snippet}
        <p class="cell">Team plan: 10 seats and priority support.</p>
      </HoverCard>
    </div>
  </TabsContent>
</Tabs>

<style>
  .pane { padding-block-start: var(--ca-space-4); max-width: 28rem; }
  .frame { height: 9rem; border: var(--ca-border-width) solid var(--ca-outline-default); border-radius: var(--ca-radius-md); overflow: hidden; margin-block-start: var(--ca-space-4); padding: 0; }
  .slide { display: grid; place-items: center; height: 6rem; margin-inline: var(--ca-space-1); border-radius: var(--ca-radius-md); background: var(--ca-surface-sunken); color: var(--ca-text-primary); font-size: var(--ca-font-size-h5); }
  .cell { margin: 0; padding: var(--ca-space-3); color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
</style>
