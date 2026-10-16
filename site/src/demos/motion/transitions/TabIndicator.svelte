<script lang="ts">
  import { MotionStage, Tabs, TabsContent, TabsList, TabsTrigger, type MotionCtx } from '@codeatlasdev/ui';

  const tabs = [
    { value: 'overview', label: 'Overview', body: '2,481 active members, up 6.2% on last week.' },
    { value: 'billing', label: 'Billing', body: 'Next invoice R$ 4.820 on 28 Oct, paid by card.' },
    { value: 'security', label: 'Security', body: '3 devices signed in, two-factor is on.' },
  ];

  let value = $state('overview');
  let stage = $state<MotionCtx>();
  let rail = $state<HTMLElement>();
  let lastCycle = -1;
  // Geometry of the active trigger, in px relative to the list. The pill is one element that
  // translates and scales; it never re-renders per tab.
  let x = $state(0);
  let w = $state(0);
  let ready = $state(false);

  function place() {
    const el = rail?.querySelector<HTMLElement>('.ca-tabs-trigger[data-state="active"]');
    if (!rail || !el) return;
    x = el.offsetLeft;
    w = el.offsetWidth;
    ready = true;
  }

  $effect(() => {
    value;
    if (!rail) return;
    place();
    const ro = new ResizeObserver(place);
    ro.observe(rail);
    return () => ro.disconnect();
  });

  $effect(() => {
    if (!stage) return;
    if (stage.reduced) {
      value = 'billing';
      return;
    }
    if (!stage.playing || stage.cycle === lastCycle) return;
    lastCycle = stage.cycle;
    value = tabs[(tabs.findIndex((t) => t.value === value) + 1) % tabs.length].value;
  });
</script>

<MotionStage label="Tab indicator: a pill slides under the active tab" loop={1800}>
  {#snippet children(m)}
    <div class="ti" class:ti--ready={ready} class:ti--instant={m.reduced} {@attach () => { stage = m; }}>
      <Tabs bind:value>
        <div class="ti__rail" bind:this={rail} style="--x:{x}px; --w:{w}px">
          <TabsList>
            <span class="ti__pill" aria-hidden="true"></span>
            {#each tabs as t (t.value)}
              <TabsTrigger value={t.value}>{t.label}</TabsTrigger>
            {/each}
          </TabsList>
        </div>
        {#each tabs as t (t.value)}
          <TabsContent value={t.value}><p class="ti__body">{t.body}</p></TabsContent>
        {/each}
      </Tabs>
    </div>
  {/snippet}
</MotionStage>

<style>
  .ti { width: 100%; max-width: 380px; }
  .ti__rail { display: inline-flex; max-inline-size: 100%; }
  /* The package trigger paints its own active pill; hand that job to the sliding one. */
  .ti :global(.ca-tabs-trigger[data-state='active']) { background: transparent; position: relative; z-index: 1; }
  .ti :global(.ca-tabs-list) { position: relative; }
  .ti__pill {
    position: absolute; inset-block: var(--ca-space-1); inset-inline-start: 0; z-index: 0;
    inline-size: var(--w); border-radius: var(--ca-radius-pill); background: var(--ca-brand-fill);
    transform: translateX(var(--x)); opacity: 0;
  }
  .ti--ready .ti__pill { opacity: 1; transition: transform 360ms cubic-bezier(0.2, 0, 0, 1), inline-size 360ms cubic-bezier(0.2, 0, 0, 1); }
  .ti--instant .ti__pill { transition: none; }
  .ti__body { margin: var(--ca-space-4) 0 0; color: var(--ca-text-secondary); }
</style>
