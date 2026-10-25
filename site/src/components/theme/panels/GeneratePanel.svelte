<script lang="ts">
  import { Alert, Button, Chip, FileUpload, SwatchGroup, TextArea } from '@codeatlasdev/ui';
  import type { PaletteColor, SwatchItem } from '@codeatlasdev/ui';
  import { randomLook, themeFromPrompt } from '../generate';
  import { brandFromImage } from '../image-brand';
  import type { StudioState } from '../studio-state';

  interface Props {
    theme: StudioState;
    onapply: (next: Partial<StudioState>, label: string) => void;
  }
  let { theme, onapply }: Props = $props();

  const uid = $props.id();

  const EXAMPLES = [
    'Retro terminal, green phosphor glow',
    'Minimal Ghibli studio vibe',
    'Brutalist yellow, loud',
    'Calm editorial paper',
    'Tema escuro azul arredondado',
  ];

  // ─── Describe ──────────────────────────────────────────────────────────────
  let prompt = $state('');
  let matched = $state<string[] | null>(null);

  function generate() {
    const text = prompt.trim();
    if (!text) return;
    const out = themeFromPrompt(text);
    matched = out.matched;
    if (out.matched.length > 0) onapply(out.state, `Generated: ${out.matched.join(', ')}`);
  }

  function onPromptKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      generate();
    }
  }

  function useExample(text: string) {
    prompt = text;
    generate();
  }

  // ─── Image ─────────────────────────────────────────────────────────────────
  let files = $state<File[]>([]);
  let busy = $state(false);
  let error = $state('');
  let preview = $state('');
  let palette = $state<PaletteColor[]>([]);
  let picked = $state('');

  const swatches = $derived<SwatchItem[]>(
    palette.map((p) => ({ value: p.hex, label: `Palette color ${p.hex}`, color: p.hex })),
  );

  async function read(file: File | undefined) {
    if (!file) return;
    error = '';
    busy = true;
    const out = await brandFromImage(file);
    busy = false;
    if (!out) {
      preview = '';
      palette = [];
      picked = '';
      error = 'Could not read colors from that file. Use a PNG, JPEG, WebP or SVG under 8 MB.';
      return;
    }
    preview = out.preview;
    palette = out.palette;
    picked = out.brand;
    onapply({ brand: out.brand }, 'Brand from image');
  }

  function onPaste(e: ClipboardEvent) {
    const item = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
    if (!item) return;
    e.preventDefault();
    void read(item);
  }

  function shuffleBrand() {
    onapply({ brand: randomLook(Date.now()).brand }, 'New brand color');
  }
</script>

<div class="ts-stack ts-gen">
  <section class="ts-section" aria-labelledby="{uid}-describe">
    <h4 id="{uid}-describe" class="ts-heading">Describe your theme</h4>
    <TextArea
      label="Describe your theme"
      hideLabel
      rows={3}
      placeholder="Retro terminal, green phosphor glow"
      description="Words only: a colour and a mood. Nothing leaves your browser. Ctrl or Cmd + Enter generates."
      bind:value={prompt}
      onkeydown={onPromptKey}
    />
    <div class="ts-row">
      <Button size="sm" disabled={prompt.trim().length === 0} onclick={generate}>Generate</Button>
    </div>
    <div class="ts-chips" role="group" aria-label="Examples">
      {#each EXAMPLES as ex (ex)}
        <Chip label={ex} size="sm" onclick={() => useExample(ex)} />
      {/each}
    </div>
    {#if matched !== null}
      <p class="ts-note" role="status">
        {#if matched.length > 0}
          Understood: {matched.join(', ')}
        {:else}
          No keywords matched, try a colour and a mood
        {/if}
      </p>
    {/if}
  </section>

  <section class="ts-section" aria-labelledby="{uid}-image">
    <h4 id="{uid}-image" class="ts-heading">From a logo or image</h4>
    <!-- Paste an image anywhere in this section. -->
    <div class="ts-drop" onpaste={onPaste} role="presentation">
      <FileUpload
        accept="image/*"
        list={false}
        maxSize={8 * 1024 * 1024}
        label="Choose or drop a logo"
        hint="PNG, JPEG, WebP or SVG, up to 8 MB. Paste works too. Never uploaded."
        bind:files
        onchange={(f) => read(f[0])}
      />
    </div>
    {#if busy}
      <p class="ts-note" role="status">Reading colors...</p>
    {/if}
    {#if error}
      <Alert severity="error" closable onclose={() => (error = '')}>{error}</Alert>
    {/if}
    {#if preview}
      <div class="ts-image">
        <img class="ts-preview" src={preview} alt="Preview of your upload" width="96" height="96" />
        <div class="ts-field">
          <span class="ts-label">Palette</span>
          <SwatchGroup
            aria-label="Palette from image"
            items={swatches}
            value={picked}
            onchange={(hex) => {
              picked = hex;
              onapply({ brand: hex }, 'Brand from image');
            }}
          />
          <div class="ts-row">
            <Button
              size="sm"
              variant="outlined"
              disabled={!picked || picked === theme.brand}
              onclick={() => onapply({ brand: picked }, 'Brand from image')}
            >
              Use as brand
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </section>

  <section class="ts-section" aria-labelledby="{uid}-random">
    <h4 id="{uid}-random" class="ts-heading">Randomize</h4>
    <div class="ts-row">
      <Button size="sm" onclick={() => onapply(randomLook(Date.now()), 'Random theme')}>Surprise me</Button>
      <Button size="sm" variant="outlined" onclick={shuffleBrand}>Shuffle brand only</Button>
    </div>
  </section>
</div>

<style>
  .ts-stack {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-6);
    min-width: 0;
  }
  .ts-section,
  .ts-field {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    min-width: 0;
  }
  .ts-heading {
    margin: 0;
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-primary);
  }
  .ts-label {
    font-size: var(--ca-font-size-label);
    font-weight: var(--ca-font-weight-medium);
    color: var(--ca-text-primary);
  }
  .ts-row,
  .ts-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ca-space-2);
    min-width: 0;
  }
  .ts-note {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
  .ts-drop {
    min-width: 0;
  }
  .ts-image {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--ca-space-3);
    align-items: start;
  }
  .ts-preview {
    inline-size: 6rem;
    block-size: 6rem;
    object-fit: contain;
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-sunken);
    box-shadow: inset 0 0 0 1px var(--ca-outline-default);
  }
  .ts-gen { container-type: inline-size; }
  @container (max-width: 26rem) {
    .ts-image {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
