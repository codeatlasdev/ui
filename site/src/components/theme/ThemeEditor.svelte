<script lang="ts">
  import {
    colorScheme, editorTokensToCSS, editorPreviewCSS, DEFAULT_CONFIG,
    Button, TextField, Select, Switch, Chip, StatusChip,
    KpiCard, Avatar, GlassCard, FilterGroup, Stack, Row, Grid,
  } from '@codeatlasdev/ui';
  import type { ThemeConfig, SurfaceStyle } from '@codeatlasdev/ui';
  import { generatePreset } from '@codeatlasdev/ui/utils/palette-generator';
  import { onMount, onDestroy } from 'svelte';
  import {
    Copy, Check, RotateCcw, Sun, Moon, Monitor,
    TrendingUp, Users, DollarSign, Activity,
  } from '@lucide/svelte';

  // ── Config state — persists to localStorage ───────────────────────────
  const STORAGE_KEY = 'ca-theme-cfg';

  function loadCfg(): ThemeConfig {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_CONFIG };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {}
    return { ...DEFAULT_CONFIG };
  }

  let cfg = $state<ThemeConfig>(loadCfg());

  // ── Live preview ───────────────────────────────────────────────────────
  // Strategy: set data-preset="custom" on <html> and inject tokens under
  // [data-preset="custom"] / .dark[data-preset="custom"] — zero specificity
  // conflict with any other theme preset.
  let previewActive  = $state(true);
  let styleEl: HTMLStyleElement | null = null;

  function applyPreview() {
    if (typeof document === 'undefined') return;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'ca-theme-editor-preview';
      document.head.appendChild(styleEl);
    }

    // Scope tokens to .te__preview-body only — never affects topbar/controls
    document.documentElement.removeAttribute('data-theme-editor');
    styleEl.textContent = editorPreviewCSS(cfg);
  }

  function removePreview() {
    if (typeof document === 'undefined') return;
    styleEl?.remove();
    styleEl = null;
    document.documentElement.removeAttribute('data-theme-editor');
  }

  // ── Save + preview on every config change ────────────────────────────
  $effect(() => {
    // Access every field explicitly so Svelte tracks each as a dependency
    const snap = {
      hue:             cfg.hue,
      chroma:          cfg.chroma,
      lightL:          cfg.lightL,
      radiusBase:      cfg.radiusBase,
      spacingBase:     cfg.spacingBase,
      fontSans:        cfg.fontSans,
      fontMono:        cfg.fontMono,
      fontScale:       cfg.fontScale,
      shadowIntensity: cfg.shadowIntensity,
      blurBase:        cfg.blurBase,
      surfaceStyle:    cfg.surfaceStyle,
      pagePx:          cfg.pagePx,
      pagePt:          cfg.pagePt,
      cardPadding:     cfg.cardPadding,
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    }
    if (previewActive) applyPreview();
  });

  onMount(() => {
    // Sync from active colorScheme on first load if no saved config
    if (!localStorage.getItem(STORAGE_KEY)) {
      const params = PRESET_PARAMS[colorScheme.preset];
      if (params) { cfg.hue = params.hue; cfg.chroma = params.chroma; cfg.lightL = params.lightL; }
      cfg.surfaceStyle = colorScheme.style;
    }
    // $effect handles preview — but runs before mount, so styleEl may not exist yet.
    // Force inject after mount to ensure the preview style element is in the DOM.
    applyPreview();
  });

  onDestroy(() => removePreview());

  // ── Preset params ─────────────────────────────────────────────────────
  const PRESET_PARAMS: Record<string, { hue: number; chroma: number; lightL: number }> = {
    amber:   { hue: 55,  chroma: 0.21, lightL: 0.54 },
    ocean:   { hue: 260, chroma: 0.22, lightL: 0.50 },
    crimson: { hue: 26,  chroma: 0.23, lightL: 0.44 },
    cyan:    { hue: 193, chroma: 0.22, lightL: 0.48 },
    violet:  { hue: 295, chroma: 0.24, lightL: 0.47 },
    emerald: { hue: 152, chroma: 0.20, lightL: 0.46 },
    rose:    { hue: 350, chroma: 0.22, lightL: 0.50 },
    slate:   { hue: 220, chroma: 0.10, lightL: 0.48 },
  };

  const PRESETS = Object.entries(PRESET_PARAMS).map(([id, v]) => ({
    id, label: id.charAt(0).toUpperCase() + id.slice(1), ...v,
  }));

  // ── Hex → hue/chroma/lightness converter ─────────────────────────
  let hexInput = $state('');

  function applyHex() {
    const hex = hexInput.replace('#', '');
    if (hex.length !== 6) return;
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (d === 0) { cfg.hue = 0; cfg.chroma = 0; return; }
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    cfg.hue    = Math.round(h * 360);
    const s    = d / (1 - Math.abs(2 * (max + min) / 2 - 1));
    cfg.chroma = Math.round(s * 0.25 * 100) / 100;
    cfg.lightL = Math.round((max + min) / 2 * 0.65 * 100) / 100;
  }

  // ── Gradients for sliders ─────────────────────────────────────────────
  const hueGradient = `linear-gradient(to right, ${
    [0,30,60,90,120,150,180,210,240,270,300,330,360]
      .map(h => `oklch(0.65 0.20 ${h})`).join(', ')
  })`;

  let chromaGradient = $derived(
    `linear-gradient(to right, oklch(${cfg.lightL} 0 ${cfg.hue}), oklch(${cfg.lightL} 0.30 ${cfg.hue}))`
  );
  let lightnessGradient = $derived(
    `linear-gradient(to right, oklch(0.15 ${cfg.chroma} ${cfg.hue}), oklch(0.54 ${cfg.chroma} ${cfg.hue}), oklch(0.85 ${cfg.chroma} ${cfg.hue}))`
  );

  // ── Palette preview ───────────────────────────────────────────────────
  let palette = $derived(generatePreset(cfg.hue, cfg.chroma, cfg.lightL));

  // ── CSS output ────────────────────────────────────────────────────────
  const css = $derived(editorTokensToCSS(cfg));
  let copied = $state(false);

  function copyCSS() {
    navigator.clipboard.writeText(css).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 1800);
    });
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    cfg = { ...DEFAULT_CONFIG };
    colorScheme.setPreset('amber');
    colorScheme.setStyle('glass');
    colorScheme.setPreference('dark');
    applyPreview(); // force re-inject with clean defaults
  }

  // ── Section nav ───────────────────────────────────────────────────────
  let activeSection = $state('color');

  const SECTIONS = [
    { id: 'color',      label: 'Color'      },
    { id: 'radius',     label: 'Radius'     },
    { id: 'spacing',    label: 'Spacing'    },
    { id: 'typography', label: 'Typography' },
    { id: 'shadows',    label: 'Shadows'    },
    { id: 'glass',      label: 'Surface'    },
  ];

  // ── Scheme ────────────────────────────────────────────────────────────
  const SCHEMES = [
    { id: 'light',  Icon: Sun,     label: 'Light'  },
    { id: 'dark',   Icon: Moon,    label: 'Dark'   },
    { id: 'system', Icon: Monitor, label: 'System' },
  ] as const;

  // ── Preview select state ──────────────────────────────────────────────
  let previewRole = $state('editor');
  const roleOpts = [
    { value: 'admin',  label: 'Admin'  },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' },
  ];
</script>


<div class="te">
  <!-- ── Top bar ── -->
  <header class="te__topbar">
    <div class="te__topbar-left">
      <span class="te__brand">Theme Editor</span>
      <span class="te__brand-sub">Customize every token · changes auto-save</span>
    </div>
    <div class="te__topbar-right">
      <button type="button" class="te-btn te-btn--ghost te-btn--sm" onclick={reset}>
        <RotateCcw size={12} /> Reset
      </button>
      <button type="button" class="te-btn te-btn--primary" onclick={copyCSS}>
        {#if copied}<Check size={13} />Copied!{:else}<Copy size={13} />Copy CSS{/if}
      </button>
    </div>
  </header>

  <div class="te__body">

    <!-- ── LEFT: controls ── -->
    <aside class="te__controls">
      <!-- Section tabs -->
      <div class="te__tabs">
        {#each SECTIONS as s}
          <button
            type="button"
            class="te__tab"
            class:active={activeSection === s.id}
            onclick={() => (activeSection = s.id)}
          >{s.label}</button>
        {/each}
      </div>

      <div class="te__panel">

        <!-- ── COLOR ── -->
        {#if activeSection === 'color'}
          <!-- Scheme -->
          <div class="te__field">
            <span class="te__label">Scheme</span>
            <div class="te__scheme-row">
              {#each SCHEMES as s}
                {@const active = colorScheme.preference === s.id}
                <button
                  type="button"
                  class="te__scheme-btn"
                  class:active
                  onclick={() => colorScheme.setPreference(s.id)}
                  title={s.label}
                >
                  <s.Icon size={14} stroke-width={active ? 2.2 : 1.6} />
                  <span>{s.label}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Hex input -->
          <div class="te__field">
            <span class="te__label">From hex</span>
            <div class="te__hex-row">
              <input
                type="text"
                class="te__input te__hex-input"
                placeholder="#c47a15"
                maxlength={7}
                bind:value={hexInput}
                onkeydown={(e) => e.key === 'Enter' && applyHex()}
              />
              <button type="button" class="te-btn te-btn--ghost te-btn--sm" onclick={applyHex}>Apply</button>
            </div>
          </div>

          <!-- Presets -->
          <div class="te__field">
            <span class="te__label">Presets</span>
            <div class="te__chips">
              {#each PRESETS as p}
                {@const active = cfg.hue === p.hue && Math.abs(cfg.chroma - p.chroma) < 0.01}
                <button
                  type="button"
                  class="te__chip"
                  class:active
                  style="--chip-c: oklch({p.lightL} {p.chroma} {p.hue})"
                  onclick={() => {
                    cfg.hue = p.hue; cfg.chroma = p.chroma; cfg.lightL = p.lightL;
                    colorScheme.setPreset(p.id as any);
                  }}
                >{p.label}</button>
              {/each}
            </div>
          </div>

          <!-- Hue -->
          <div class="te__field">
            <label class="te__label" for="hue">Hue <span class="te__val">{Math.round(cfg.hue)}°</span></label>
            <div class="te__slider-wrap" style="--track:{hueGradient}">
              <input id="hue" type="range" class="te__slider" min={0} max={360} step={1} bind:value={cfg.hue} />
            </div>
          </div>

          <!-- Chroma -->
          <div class="te__field">
            <label class="te__label" for="chroma">Chroma <span class="te__val">{(cfg.chroma * 100).toFixed(0)}%</span></label>
            <div class="te__slider-wrap" style="--track:{chromaGradient}">
              <input id="chroma" type="range" class="te__slider" min={0} max={0.32} step={0.005} bind:value={cfg.chroma} />
            </div>
          </div>

          <!-- Lightness -->
          <div class="te__field">
            <label class="te__label" for="lightness">Lightness <span class="te__val">{(cfg.lightL * 100).toFixed(0)}%</span></label>
            <div class="te__slider-wrap" style="--track:{lightnessGradient}">
              <input id="lightness" type="range" class="te__slider" min={0.32} max={0.72} step={0.01} bind:value={cfg.lightL} />
            </div>
          </div>

          <!-- Brand scale -->
          <div class="te__field">
            <span class="te__label">Brand scale</span>
            <div class="te__scale">
              <div class="te__sw" style="--sw:{palette.brandDark}" title="dark"></div>
              <div class="te__sw" style="--sw:{palette.brandMain}" title="main"></div>
              <div class="te__sw" style="--sw:{palette.brandLight}" title="light"></div>
              <div class="te__sw te__sw--lg" style="--sw:{palette.brandMain};--sw-fg:{palette.brandContrast}">Aa</div>
            </div>
          </div>

          <!-- Surface scales -->
          <div class="te__field">
            <span class="te__label">Surfaces — light</span>
            <div class="te__scale">
              {#each [palette.surfaceSunken, palette.surfaceBase, palette.surfaceRaised, palette.surfaceOverlay] as s}
                <div class="te__sw te__sw--border" style="--sw:{s}"></div>
              {/each}
            </div>
          </div>
          <div class="te__field">
            <span class="te__label">Surfaces — dark</span>
            <div class="te__scale">
              {#each [palette.dark.surfaceSunken, palette.dark.surfaceBase, palette.dark.surfaceRaised, palette.dark.surfaceOverlay] as s}
                <div class="te__sw te__sw--dark" style="--sw:{s}"></div>
              {/each}
            </div>
          </div>

        {:else if activeSection === 'radius'}
          <div class="te__field">
            <label class="te__label" for="radius-base">Base (md) <span class="te__val">{cfg.radiusBase}px</span></label>
            <div class="te__slider-wrap" style="--track: linear-gradient(to right, var(--ca-outline-default), var(--ca-brand-main))">
              <input id="radius-base" type="range" class="te__slider" min={0} max={24} step={1} bind:value={cfg.radiusBase} />
            </div>
          </div>
          <div class="te__radius-grid">
            {#each [
              { label: 'xs', val: Math.round((cfg.radiusBase / 10) * 4) },
              { label: 'sm', val: Math.round((cfg.radiusBase / 10) * 6) },
              { label: 'md', val: cfg.radiusBase },
              { label: 'lg', val: Math.round((cfg.radiusBase / 10) * 14) },
              { label: 'xl', val: Math.round((cfg.radiusBase / 10) * 20) },
            ] as r}
              <div class="te__radius-item">
                <div class="te__radius-box" style="--r:{r.val}px"></div>
                <span class="te__tiny">{r.label}</span>
                <span class="te__val">{r.val}px</span>
              </div>
            {/each}
          </div>

        {:else if activeSection === 'spacing'}
          <div class="te__field">
            <label class="te__label" for="spacing-base">Base unit <span class="te__val">{cfg.spacingBase}px</span></label>
            <div class="te__slider-wrap" style="--track: linear-gradient(to right, var(--ca-outline-default), var(--ca-brand-main))">
              <input id="spacing-base" type="range" class="te__slider" min={2} max={8} step={1} bind:value={cfg.spacingBase} />
            </div>
          </div>
          <div class="te__field">
            <label class="te__label" for="page-px">Page padding <span class="te__val">{cfg.pagePx}px</span></label>
            <div class="te__slider-wrap" style="--track: linear-gradient(to right, var(--ca-outline-default), var(--ca-brand-main))">
              <input id="page-px" type="range" class="te__slider" min={12} max={48} step={2} bind:value={cfg.pagePx} />
            </div>
          </div>
          <div class="te__field">
            <label class="te__label" for="card-padding">Card padding <span class="te__val">{cfg.cardPadding}px</span></label>
            <div class="te__slider-wrap" style="--track: linear-gradient(to right, var(--ca-outline-default), var(--ca-brand-main))">
              <input id="card-padding" type="range" class="te__slider" min={8} max={40} step={2} bind:value={cfg.cardPadding} />
            </div>
          </div>
          <div class="te__sp-preview">
            {#each [1,2,3,4,5,6,8] as n}
              <div class="te__sp-row">
                <span class="te__val">×{n}</span>
                <div class="te__sp-bar" style="--w:{cfg.spacingBase * n}px"></div>
                <span class="te__tiny">{cfg.spacingBase * n}px</span>
              </div>
            {/each}
          </div>

        {:else if activeSection === 'typography'}
          <div class="te__field">
            <label class="te__label" for="font-scale">Scale <span class="te__val">{cfg.fontScale.toFixed(2)}×</span></label>
            <div class="te__slider-wrap" style="--track: linear-gradient(to right, var(--ca-outline-default), var(--ca-brand-main))">
              <input id="font-scale" type="range" class="te__slider" min={0.8} max={1.3} step={0.01} bind:value={cfg.fontScale} />
            </div>
          </div>
          <div class="te__field">
            <label class="te__label" for="font-sans">Sans</label>
            <input id="font-sans" type="text" class="te__input" bind:value={cfg.fontSans} />
          </div>
          <div class="te__field">
            <label class="te__label" for="font-mono">Mono</label>
            <input id="font-mono" type="text" class="te__input" bind:value={cfg.fontMono} />
          </div>
          <div class="te__type-list">
            {#each [
              { label: 'h1',      size: 2.25   },
              { label: 'h2',      size: 1.875  },
              { label: 'h3',      size: 1.5    },
              { label: 'body1',   size: 0.9375 },
              { label: 'body2',   size: 0.8125 },
              { label: 'caption', size: 0.75   },
            ] as t}
              <div class="te__type-row">
                <span class="te__val">{t.label}</span>
                <span class="te__type-sample" style="--fs:{t.size * cfg.fontScale}rem">Aa</span>
                <span class="te__tiny">{(t.size * cfg.fontScale * 16).toFixed(1)}px</span>
              </div>
            {/each}
          </div>

        {:else if activeSection === 'shadows'}
          <div class="te__field">
            <label class="te__label" for="shadow-intensity">Intensity <span class="te__val">{(cfg.shadowIntensity * 100).toFixed(0)}%</span></label>
            <div class="te__slider-wrap" style="--track: linear-gradient(to right, var(--ca-outline-default), var(--ca-text-primary))">
              <input id="shadow-intensity" type="range" class="te__slider" min={0} max={2} step={0.05} bind:value={cfg.shadowIntensity} />
            </div>
          </div>
          <div class="te__shadow-grid">
            {#each ['xs','sm','md','lg','xl'] as s}
              <div class="te__shadow-card" style="--sh:var(--ca-shadow-{s})">
                <span class="te__tiny">{s}</span>
              </div>
            {/each}
          </div>

        {:else if activeSection === 'glass'}
          <div class="te__field">
            <span class="te__label">Surface style</span>
            <div class="te__style-grid">
              {#each [
                { id: 'glass',   label: 'Liquid Glass', desc: 'Blur + mesh bg'          },
                { id: 'frosted', label: 'Frosted',       desc: 'Reduced blur'            },
                { id: 'solid',   label: 'Solid',         desc: 'Opaque, pastel-friendly' },
                { id: 'flat',    label: 'Flat',          desc: 'No elevation'            },
              ] as s}
                <button
                  type="button"
                  class="te__style-card"
                  class:active={cfg.surfaceStyle === s.id}
                  onclick={() => { cfg.surfaceStyle = s.id as SurfaceStyle; colorScheme.setStyle(s.id as SurfaceStyle); }}
                >
                  <div class="te__style-preview te__style-preview--{s.id}">
                    <div class="te__sp-chrome"></div>
                    <div class="te__sp-content">
                      <div class="te__sp-mock"></div>
                      <div class="te__sp-mock te__sp-mock--sm"></div>
                    </div>
                  </div>
                  <span class="te__style-label">{s.label}</span>
                  <span class="te__style-desc">{s.desc}</span>
                </button>
              {/each}
            </div>
          </div>

          {#if cfg.surfaceStyle === 'glass' || cfg.surfaceStyle === 'frosted'}
            <div class="te__field">
              <label class="te__label" for="blur-base">Blur base <span class="te__val">{cfg.blurBase}px</span></label>
              <div class="te__slider-wrap" style="--track: linear-gradient(to right, var(--ca-outline-default), var(--ca-brand-main))">
                <input id="blur-base" type="range" class="te__slider" min={4} max={32} step={1} bind:value={cfg.blurBase} />
              </div>
            </div>
          {/if}

          <div class="te__glass-demo">
            <div class="te__glass-sample glass-overlay"><span>overlay</span></div>
            <div class="te__glass-sample glass-panel"><span>panel</span></div>
            <div class="te__glass-sample glass-chrome-layer"><span>chrome</span></div>
          </div>
        {/if}

      </div>
    </aside>

    <!-- ── CENTER: live preview ── -->
    <div class="te__preview">
      <div class="te__preview-header">
        <span class="te__preview-title">Live preview</span>
        <div class="te__preview-actions">
          <button
            type="button"
            class="te__scheme-pill"
            onclick={() => colorScheme.toggle()}
            title={colorScheme.isDark ? 'Switch to light' : 'Switch to dark'}
          >
            {#if colorScheme.isDark}
              <Sun size={13} stroke-width={1.6} />
            {:else}
              <Moon size={13} stroke-width={1.6} />
            {/if}
          </button>
        </div>
      </div>

      <div class="te__preview-body">
        <!-- KPI row -->
        <Grid cols="repeat(2, 1fr)" gap={10}>
          <KpiCard title="Revenue"  value="$48k"  trend={12.4}  icon={DollarSign} />
          <KpiCard title="Users"    value="3.8k"   trend={-2.1}  icon={Users}      />
        </Grid>

        <!-- Buttons -->
        <GlassCard padding="16px">
          <Stack gap={12}>
            <span class="te__preview-section-label">Buttons</span>
            <Row gap={8} align="center">
              <Button variant="filled">Primary</Button>
              <Button variant="outlined">Outlined</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Delete</Button>
            </Row>
          </Stack>
        </GlassCard>

        <!-- Form inputs -->
        <GlassCard padding="16px">
          <Stack gap={12}>
            <span class="te__preview-section-label">Inputs</span>
            <TextField label="Email" placeholder="you@example.com" />
            <Select label="Role" options={roleOpts} bind:value={previewRole} />
            <Row gap={16} align="center">
              <Switch label="Notifications" checked={true} />
              <Switch label="Dark mode" />
            </Row>
          </Stack>
        </GlassCard>

        <!-- Chips & Status -->
        <GlassCard padding="16px">
          <Stack gap={10}>
            <span class="te__preview-section-label">Display</span>
            <Row gap={6} align="center">
              <Chip label="Active" variant="success" />
              <Chip label="Beta" variant="brand" />
              <Chip label="Archived" />
            </Row>
            <Row gap={6} align="center">
              <StatusChip status="success" label="Active" />
              <StatusChip status="warning" label="Pending" />
              <StatusChip status="error" label="Failed" />
              <StatusChip status="neutral" label="Draft" />
            </Row>
            <Row gap={8} align="center">
              <Avatar alt="Ana Lima" size="sm" />
              <Avatar alt="Carlos Melo" size="sm" />
              <Avatar alt="Diana Kwan" size="sm" />
              <Avatar alt="Ed Smith" size="sm" />
            </Row>
          </Stack>
        </GlassCard>

        <!-- Filter group -->
        <GlassCard padding="16px">
          <Stack gap={10}>
            <span class="te__preview-section-label">Filter + Search</span>
            <TextField placeholder="Search…" size="sm" />
            <FilterGroup options={[
              { value: 'all',    label: 'All'      },
              { value: 'admin',  label: 'Admin'    },
              { value: 'editor', label: 'Editor'   },
              { value: 'viewer', label: 'Viewer'   },
            ]} />
          </Stack>
        </GlassCard>
      </div>
    </div>

    <!-- ── RIGHT: CSS output ── -->
    <aside class="te__output">
      <div class="te__output-header">
        <span class="te__output-title">CSS output</span>
        <button type="button" class="te-btn te-btn--ghost te-btn--sm" onclick={copyCSS}>
          {#if copied}<Check size={11} />Copied{:else}<Copy size={11} />Copy{/if}
        </button>
      </div>
      <!-- Scrollable region: keyboard-focusable on purpose (axe scrollable-region-focusable). -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <pre class="te__code" tabindex="0" role="region" aria-label="Generated CSS"><code>{css}</code></pre>
    </aside>

  </div>
</div>

<style>
  /* ── Root — full viewport ────────────────────────────────────────── */
  .te {
    display: flex;
    flex-direction: column;
    height: var(--ca-vh);
    overflow: hidden;
    background: var(--ca-surface-base);
  }

  /* ── Top bar ─────────────────────────────────────────────────────── */
  .te__topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 0 20px;
    height: 48px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--ca-outline-subtle);
    background: var(--ca-surface-raised);
  }

  .te__topbar-left { display: flex; align-items: baseline; gap: 12px; }

  .te__brand {
    font-size: var(--ca-font-size-body1);
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--ca-text-primary);
  }

  .te__brand-sub {
    font-size: var(--ca-font-size-nano);
    color: var(--ca-text-hint);
  }

  .te__topbar-right { display: flex; gap: 8px; align-items: center; }

  /* ── Body — 3 columns ────────────────────────────────────────────── */
  .te__body {
    display: grid;
    grid-template-columns: 280px 1fr 260px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  @media (max-width: 1199.98px) {
    .te__body { grid-template-columns: 260px 1fr; }
    .te__output { display: none; }
  }
  @media (max-width: 899.98px) {
    .te__body { grid-template-columns: 1fr; }
    .te__controls { display: none; }
  }

  /* ── Controls ────────────────────────────────────────────────────── */
  .te__controls {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--ca-outline-subtle);
    overflow: hidden;
  }

  .te__tabs {
    display: flex;
    flex-shrink: 0;
    overflow-x: auto;
    border-bottom: 1px solid var(--ca-outline-subtle);
    padding: 4px 4px 0;
    gap: 1px;
    background: var(--ca-surface-sunken);
  }
  .te__tabs::-webkit-scrollbar { height: 0; }

  .te__tab {
    padding: 5px 10px 7px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: var(--ca-font-size-micro);
    font-weight: 600;
    font-family: inherit;
    color: var(--ca-text-secondary);
    border-radius: var(--ca-radius-sm) var(--ca-radius-sm) 0 0;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: color var(--ca-duration-fast), border-color var(--ca-duration-fast);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .te__tab.active { color: var(--ca-brand-text); border-bottom-color: var(--ca-brand-main); }
  .te__tab:hover:not(.active) { color: var(--ca-text-primary); background: var(--ca-action-hover); }

  .te__panel {
    flex: 1;
    overflow-y: auto;
    padding: 14px 14px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .te__panel::-webkit-scrollbar { width: 4px; }
  .te__panel::-webkit-scrollbar-thumb { background: var(--ca-outline-default); border-radius: 999px; }

  /* ── Field ───────────────────────────────────────────────────────── */
  .te__field { display: flex; flex-direction: column; gap: 6px; }

  .te__label {
    font-size: var(--ca-font-size-micro);
    font-weight: 600;
    color: var(--ca-text-secondary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .te__val {
    font-variant-numeric: tabular-nums;
    color: var(--ca-brand-text);
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
    font-family: var(--ca-font-mono);
    font-size: var(--ca-font-size-micro);
  }

  .te__tiny {
    font-size: var(--ca-font-size-nano);
    color: var(--ca-text-hint);
  }

  /* ── Scheme row ──────────────────────────────────────────────────── */
  .te__scheme-row {
    display: flex;
    gap: 4px;
    background: var(--ca-action-hover);
    border: 1px solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-pill);
    padding: 3px;
  }

  .te__scheme-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 28px;
    padding: 0 8px;
    border: none;
    border-radius: var(--ca-radius-pill);
    background: transparent;
    cursor: pointer;
    font-size: var(--ca-font-size-micro);
    font-weight: 500;
    font-family: inherit;
    color: var(--ca-text-secondary);
    transition: background var(--ca-duration-fast), color var(--ca-duration-fast);
  }
  .te__scheme-btn.active {
    background: var(--ca-surface-overlay);
    color: var(--ca-text-primary);
    box-shadow: var(--ca-shadow-xs);
  }

  /* ── Preset chips ────────────────────────────────────────────────── */
  .te__chips { display: flex; flex-wrap: wrap; gap: 4px; }

  .te__chip {
    padding: 3px 9px;
    min-height: 24px;
    border-radius: var(--ca-radius-pill);
    font-size: var(--ca-font-size-micro);
    font-weight: 500;
    border: none;
    background: color-mix(in oklch, var(--chip-c) 14%, transparent);
    /* Preset hue identifies the chip via the ring/fill; text stays neutral so contrast never depends on the hue. */
    color: var(--ca-text-primary);
    cursor: pointer;
    box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--chip-c) 30%, transparent);
    transition: background var(--ca-duration-fast), box-shadow var(--ca-duration-fast);
    font-family: inherit;
  }
  .te__chip.active {
    background: color-mix(in oklch, var(--chip-c) 22%, transparent);
    box-shadow: inset 0 0 0 2px var(--chip-c);
  }
  .te__chip:hover { background: color-mix(in oklch, var(--chip-c) 22%, transparent); }

  /* ── Sliders ─────────────────────────────────────────────────────── */
  .te__slider-wrap { position: relative; height: 24px; display: flex; align-items: center; }

  .te__slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 7px;
    border-radius: var(--ca-radius-pill);
    background: var(--track);
    outline: none;
    border: none;
    cursor: pointer;
    box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.10);
  }
  .te__slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--ca-surface-overlay);
    border: 2px solid var(--ca-brand-main);
    box-shadow: var(--ca-shadow-sm);
    cursor: pointer;
    transition: transform var(--ca-duration-fast) var(--ca-ease-spring);
  }
  .te__slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
  .te__slider::-moz-range-thumb {
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--ca-surface-overlay);
    border: 2px solid var(--ca-brand-main);
    cursor: pointer;
  }

  /* ── Text input ──────────────────────────────────────────────────── */
  .te__input {
    height: 30px;
    padding: 0 8px;
    border-radius: var(--ca-radius-sm);
    background: var(--ca-surface-sunken);
    border: 1px solid var(--ca-outline-subtle);
    color: var(--ca-text-primary);
    font: inherit;
    font-size: var(--ca-font-size-micro);
    font-family: var(--ca-font-mono);
    outline: none;
    transition: border-color var(--ca-duration-fast);
  }
  .te__input:focus { border-color: var(--ca-brand-main); }

  /* ── Scale swatches ──────────────────────────────────────────────── */
  .te__scale { display: flex; gap: 3px; align-items: center; }

  .te__sw {
    width: 26px; height: 26px;
    border-radius: var(--ca-radius-sm);
    background: var(--sw);
    box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.10);
    flex-shrink: 0;
  }
  .te__sw--lg {
    flex: 1;
    display: flex; align-items: center; justify-content: center;
    font-size: var(--ca-font-size-caption);
    font-weight: 700;
    color: var(--sw-fg);
    border-radius: var(--ca-radius-md);
  }
  .te__sw--border { box-shadow: inset 0 0 0 1px var(--ca-outline-default); }
  .te__sw--dark   { box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.12); }

  /* ── Hex row ─────────────────────────────────────────────────────── */
  .te__hex-row { display: flex; gap: 6px; }
  .te__hex-input { flex: 1; font-family: var(--ca-font-mono); }

  /* ── Radius ──────────────────────────────────────────────────────── */
  .te__radius-grid { display: flex; gap: 8px; flex-wrap: wrap; }

  .te__radius-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }

  .te__radius-box {
    width: 36px; height: 36px;
    border-radius: var(--r);
    background: color-mix(in oklch, var(--ca-brand-main) 12%, transparent);
    border: 1.5px solid var(--ca-brand-main);
  }

  /* ── Spacing ─────────────────────────────────────────────────────── */
  .te__sp-preview { display: flex; flex-direction: column; gap: 5px; }

  .te__sp-row { display: flex; align-items: center; gap: 8px; }

  .te__sp-bar {
    height: 7px;
    width: var(--w);
    background: var(--ca-brand-main);
    border-radius: var(--ca-radius-pill);
    flex-shrink: 0;
    min-width: 4px;
    transition: width var(--ca-duration-fast);
  }

  /* ── Typography ──────────────────────────────────────────────────── */
  .te__type-list {
    border: 1px solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-md);
    overflow: hidden;
  }

  .te__type-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 5px 10px;
    border-bottom: 1px solid var(--ca-outline-subtle);
  }
  .te__type-row:last-child { border-bottom: none; }

  .te__type-sample {
    font-size: var(--fs);
    font-weight: 600;
    color: var(--ca-text-primary);
    line-height: 1.2;
  }

  /* ── Shadows ─────────────────────────────────────────────────────── */
  .te__shadow-grid { display: flex; gap: 8px; flex-wrap: wrap; }

  .te__shadow-card {
    flex: 1;
    min-width: 40px;
    height: 48px;
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-raised);
    box-shadow: var(--sh);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 6px;
  }

  /* ── Surface style ───────────────────────────────────────────────── */
  .te__style-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }

  .te__style-card {
    display: flex; flex-direction: column; gap: 5px;
    padding: 8px;
    border-radius: var(--ca-radius-md);
    border: 1.5px solid var(--ca-outline-subtle);
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: border-color var(--ca-duration-fast), background var(--ca-duration-fast);
  }
  .te__style-card:hover { background: var(--ca-action-hover); }
  .te__style-card.active {
    border-color: var(--ca-brand-main);
    background: color-mix(in oklch, var(--ca-brand-main) 8%, transparent);
  }

  .te__style-preview {
    width: 100%; height: 44px;
    border-radius: var(--ca-radius-sm);
    overflow: hidden;
    display: flex; flex-direction: column;
    gap: 3px; padding: 4px;
  }
  .te__style-preview--glass   { background: linear-gradient(135deg, color-mix(in oklch, var(--ca-brand-main) 20%, var(--ca-surface-base)), var(--ca-surface-base)); }
  .te__style-preview--frosted { background: linear-gradient(135deg, color-mix(in oklch, var(--ca-brand-main) 8%, var(--ca-surface-base)), var(--ca-surface-base)); }
  .te__style-preview--solid,
  .te__style-preview--flat    { background: var(--ca-surface-base); }

  .te__sp-chrome {
    height: 7px; border-radius: 2px;
    background: var(--ca-glass-tint-chrome);
  }
  .te__style-preview--solid .te__sp-chrome,
  .te__style-preview--flat  .te__sp-chrome {
    background: var(--ca-surface-raised);
    border: 1px solid var(--ca-outline-subtle);
  }

  .te__sp-content { display: flex; gap: 3px; flex: 1; }

  .te__sp-mock {
    flex: 1; border-radius: 2px;
    background: var(--ca-glass-tint-thin);
  }
  .te__style-preview--solid .te__sp-mock,
  .te__style-preview--flat  .te__sp-mock {
    background: var(--ca-surface-raised);
    border: 1px solid var(--ca-outline-subtle);
  }
  .te__sp-mock--sm { max-width: 30%; }

  .te__style-label { font-size: var(--ca-font-size-caption); font-weight: 600; color: var(--ca-text-primary); }
  .te__style-desc  { font-size: var(--ca-font-size-nano); color: var(--ca-text-hint); line-height: 1.4; }

  /* ── Glass demo ──────────────────────────────────────────────────── */
  .te__glass-demo {
    border-radius: var(--ca-radius-md);
    overflow: hidden;
    background: linear-gradient(135deg, var(--ca-brand-main), oklch(0.55 0.18 235));
    padding: 12px;
    display: flex;
    gap: 6px;
  }

  .te__glass-sample {
    flex: 1; padding: 10px 6px;
    border-radius: var(--ca-radius-sm);
    font-size: var(--ca-font-size-micro);
    font-weight: 600;
    color: var(--ca-text-primary);
    text-align: center;
  }

  /* ── Center preview ──────────────────────────────────────────────── */
  .te__preview {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--ca-outline-subtle);
    overflow: hidden;
    background: var(--ca-surface-base);
  }

  .te__preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--ca-outline-subtle);
    flex-shrink: 0;
    background: var(--ca-surface-sunken);
  }

  .te__preview-title {
    font-size: var(--ca-font-size-micro);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ca-text-hint);
  }

  .te__preview-actions { display: flex; gap: 4px; align-items: center; }

  .te__scheme-pill {
    width: 28px; height: 28px;
    border-radius: var(--ca-radius-sm);
    border: 1px solid var(--ca-outline-subtle);
    background: transparent;
    cursor: pointer;
    color: var(--ca-text-secondary);
    display: flex; align-items: center; justify-content: center;
    transition: background var(--ca-duration-fast), color var(--ca-duration-fast), border-color var(--ca-duration-fast);
  }
  .te__scheme-pill.active {
    background: color-mix(in oklch, var(--ca-brand-main) 12%, transparent);
    border-color: var(--ca-brand-main);
    color: var(--ca-brand-text);
  }
  .te__scheme-pill:hover:not(.active) { background: var(--ca-action-hover); color: var(--ca-text-primary); }

  .te__preview-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .te__preview-body::-webkit-scrollbar { width: 4px; }
  .te__preview-body::-webkit-scrollbar-thumb { background: var(--ca-outline-default); border-radius: 999px; }

  .te__preview-section-label {
    font-size: var(--ca-font-size-nano);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ca-text-hint);
    padding-bottom: 4px;
    border-bottom: 1px solid var(--ca-outline-subtle);
    display: block;
    width: 100%;
  }

  /* ── CSS output ──────────────────────────────────────────────────── */
  .te__output {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--ca-surface-base);
  }

  .te__output-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--ca-outline-subtle);
    flex-shrink: 0;
    background: var(--ca-surface-sunken);
  }

  .te__output-title {
    font-size: var(--ca-font-size-micro);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ca-text-hint);
  }

  .te__code {
    flex: 1;
    overflow-y: auto;
    margin: 0;
    padding: 14px;
    font-family: var(--ca-font-mono);
    font-size: var(--ca-font-size-nano);
    line-height: 1.7;
    color: var(--ca-text-secondary);
    background: var(--ca-surface-sunken);
    white-space: pre;
    tab-size: 2;
  }
  .te__code::-webkit-scrollbar { width: 3px; }
  .te__code::-webkit-scrollbar-thumb { background: var(--ca-outline-default); border-radius: 999px; }

  /* ── Buttons ─────────────────────────────────────────────────────── */
  .te-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 12px;
    border-radius: var(--ca-radius-md);
    font-size: var(--ca-font-size-caption);
    font-weight: 500;
    cursor: pointer;
    border: none;
    font-family: inherit;
    white-space: nowrap;
    transition: background var(--ca-duration-fast), color var(--ca-duration-fast);
  }

  .te-btn--primary {
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
  }
  .te-btn--primary:hover { background: var(--ca-brand-dark); }

  .te-btn--ghost {
    background: var(--ca-action-hover);
    color: var(--ca-text-secondary);
    box-shadow: inset 0 0 0 1px var(--ca-outline-default);
  }
  .te-btn--ghost:hover { background: var(--ca-action-selected); color: var(--ca-text-primary); }
  .te-btn--sm { height: 26px; padding: 0 8px; font-size: var(--ca-font-size-nano); }
</style>
