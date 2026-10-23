<script lang="ts">
  import { untrack } from 'svelte';
  import { AppShellLayout, Button, Card, PageShell, type NavModule } from '@codeatlasdev/ui';
  import { Compass, Layers, Map as MapIcon } from '@lucide/svelte';

  const modules: NavModule[] = [
    {
      id: 'field',
      label: 'Field',
      icon: MapIcon,
      basePath: '/field',
      items: [
        { id: 'leads', label: 'Leads', icon: Layers, path: '/field/leads' },
        { id: 'routes', label: 'Routes', icon: Compass, path: '/field/routes' },
        { id: 'report', label: 'Report', icon: MapIcon, path: '/field/report' },
      ],
    },
  ];

  // A stand-in for a map: its camera is state that a remount would lose.
  let x = $state(0);
  let y = $state(0);
  let drag: { px: number; py: number } | null = null;

  let pathname = $state('/field/leads');
  let stageVisible = $state(true);
  // Counted in the stage itself: it must stay at 1 while the pages change.
  let mounts = $state(0);

  function intercept(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest('a[href^="/"]');
    if (!a) return;
    e.preventDefault();
    pathname = a.getAttribute('href')!;
  }
</script>

{#snippet stage(s: { hidden: boolean })}
  <div
    class="map"
    class:map--paused={s.hidden}
    role="presentation"
    style="--x:{x}px;--y:{y}px"
    {@attach () => untrack(() => { mounts += 1; })}
    onpointerdown={(e) => { drag = { px: e.clientX - x, py: e.clientY - y }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
    onpointermove={(e) => { if (drag) { x = e.clientX - drag.px; y = e.clientY - drag.py; } }}
    onpointerup={() => (drag = null)}
  >
    <span class="pin">Camera {Math.round(x)}, {Math.round(y)}</span>
  </div>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="frame" onclick={intercept}>
  <AppShellLayout {modules} {pathname} onNavigate={(path) => (pathname = path)} {stage} {stageVisible} persistPanel={false} mainId={null} skipLink={false}>
    <PageShell title="Floating over the stage" description={pathname}>
      <div class="ca-stage-panel panel">
        <Card material="glass" full>
          <p class="hint">Stage mounted {mounts} time(s). Navigate the panel: the count stays at 1. Drag the stage behind this card; empty areas pass clicks through.</p>
          <Button variant="outlined" onclick={() => (stageVisible = !stageVisible)}>{stageVisible ? 'Hide and pause stage' : 'Show stage'}</Button>
        </Card>
      </div>
    </PageShell>
  </AppShellLayout>
</div>

<style>
  .frame {
    --ca-vh: 440px;
    position: relative;
    width: 100%;
    height: 440px;
    contain: layout paint;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
  }
  .panel { max-width: 22rem; }
  .map {
    position: absolute;
    inset: 0;
    cursor: grab;
    background:
      linear-gradient(var(--ca-outline-subtle) 1px, transparent 1px) var(--x) var(--y) / 48px 48px,
      linear-gradient(90deg, var(--ca-outline-subtle) 1px, transparent 1px) var(--x) var(--y) / 48px 48px,
      color-mix(in oklab, var(--ca-brand-main) 10%, var(--ca-surface-base));
    touch-action: none;
  }
  .map--paused { cursor: default; }
  .pin {
    position: absolute;
    right: var(--ca-space-3);
    bottom: var(--ca-space-3);
    padding: var(--ca-space-1) var(--ca-space-2);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    font-size: var(--ca-font-size-caption);
  }
  .hint {
    margin: 0 0 var(--ca-space-3);
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
</style>
