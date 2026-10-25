<script lang="ts">
  import {
    announce, Button, Card, CodeTabs, CopyButton, Switch, Tabs, TabsContent,
    TabsList, TabsTrigger, TextField,
  } from "@codeatlasdev/ui";
  import { CodeSnippet } from "@codeatlasdev/ui/code";
  import { onMount } from "svelte";
  import { applyToSite, readApplied, resetSite } from "../apply-site";
  import { agentPrompt, cssSource, shareURL, themeSource, wiringSource } from "../studio-output";
  import { decodeState, encodeState, type StudioState } from "../studio-state";
  import { extractCode } from "./output-model";

  interface Props {
    theme: StudioState;
    /** The site's own default preset id: a custom brand rides on it when applied to the site. */
    sitePreset: string;
    /** Called with the decoded theme when the visitor loads a share code. */
    onrestore: (next: StudioState) => void;
  }

  let { theme, sitePreset, onrestore }: Props = $props();

  let tab = $state("theme");

  // ── theme.ts ───────────────────────────────────────────────────────────────
  const codeTabs = $derived([
    { label: "theme.ts", code: themeSource(theme) },
    { label: "CSS", code: cssSource(theme) },
    { label: "SvelteKit", code: wiringSource("kit") },
    { label: "Astro", code: wiringSource("astro") },
  ]);

  // ── Share ──────────────────────────────────────────────────────────────────
  // `location` does not exist during SSR: render the code-only form until mounted.
  let base = $state<string | null>(null);
  const code = $derived(encodeState(theme));
  const link = $derived(base === null ? `#t=${code}` : shareURL(theme, base));

  let pasted = $state("");
  let pastedError = $state<string | undefined>(undefined);

  function load() {
    const extracted = extractCode(pasted);
    const decoded = extracted ? decodeState(extracted) : null;
    if (!decoded) {
      pastedError = "Not a Theme Studio code";
      return;
    }
    pastedError = undefined;
    pasted = "";
    onrestore(decoded);
    announce("Theme loaded into the editor", "polite");
  }

  // ── For AI ─────────────────────────────────────────────────────────────────
  const prompt = $derived(agentPrompt(theme));

  // ── Apply to site ──────────────────────────────────────────────────────────
  let applied = $state(false);
  let appliedCode = $state<string | null>(null);
  let frame = 0;

  const differs = $derived(appliedCode !== null && appliedCode !== code);

  onMount(() => {
    base = location.href;
    const stored = readApplied();
    applied = stored !== null;
    appliedCode = stored?.code ?? null;
    return () => cancelAnimationFrame(frame);
  });

  function apply() {
    appliedCode = applyToSite(theme, sitePreset).code;
  }

  function toggle(on: boolean) {
    cancelAnimationFrame(frame);
    frame = 0;
    if (on) {
      apply();
      announce("Theme applied to the site", "polite");
    } else {
      resetSite();
      appliedCode = null;
      announce("Site theme reset to sketchbook", "polite");
    }
  }

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    resetSite();
    applied = false;
    appliedCode = null;
    announce("Site theme reset to sketchbook", "polite");
  }

  // While on, every change of `theme` re-applies, at most once per frame.
  $effect(() => {
    JSON.stringify($state.snapshot(theme));
    if (!applied) return;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      apply();
    });
  });
</script>

<div class="ts-output">
  <Card title="Try it on the whole site" headingLevel={3}>
    <div class="ts-apply">
      <Switch bind:checked={applied} label="Apply to the whole site" onchange={toggle} />
      <p class="ts-caption">
        Only changes this browser. Reload or browse docs and gallery in your theme. Reset any time.
      </p>
      {#if differs}
        <p class="ts-note">Applied theme differs from the editor</p>
      {/if}
      <div>
        <Button variant="outlined" size="sm" onclick={reset}>Reset to sketchbook</Button>
      </div>
    </div>
  </Card>

  <Tabs bind:value={tab}>
    <TabsList>
      <TabsTrigger value="theme">theme.ts</TabsTrigger>
      <TabsTrigger value="share">Share</TabsTrigger>
      <TabsTrigger value="ai">For AI</TabsTrigger>
    </TabsList>

    <TabsContent value="theme">
      <div class="ts-stack">
        <p class="ts-caption">Paste into src/lib/theme.ts (SvelteKit) or src/theme.ts (Astro).</p>
        <CodeTabs tabs={codeTabs} sync="" />
      </div>
    </TabsContent>

    <TabsContent value="share">
      <div class="ts-stack">
        <div class="ts-row">
          <div class="ts-grow">
            <TextField label="Share link" value={link} readonly />
          </div>
          <CopyButton value={link} label="Copy link" variant="outlined" />
        </div>
        <p class="ts-caption">Opening this link restores the editor exactly as it is now.</p>

        <div class="ts-row">
          <div class="ts-grow">
            <TextField
              label="Open from a code"
              placeholder="Paste a link or v1.…"
              bind:value={pasted}
              error={pastedError}
              oninput={() => (pastedError = undefined)}
              autocomplete="off"
            />
          </div>
          <Button variant="outlined" onclick={load}>Load</Button>
        </div>
      </div>
    </TabsContent>

    <TabsContent value="ai">
      <div class="ts-stack">
        <p class="ts-caption">
          Paste this into your coding agent (Claude Code, Cursor, Codex). It contains the theme and
          where it goes.
        </p>
        <CodeSnippet code={prompt} language="bash" />
        <div>
          <CopyButton value={prompt} label="Copy prompt" variant="outlined" />
        </div>
      </div>
    </TabsContent>
  </Tabs>
</div>

<style>
  .ts-output {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    min-width: 0;
  }
  .ts-apply,
  .ts-stack {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    min-width: 0;
  }
  .ts-stack {
    padding-block-start: var(--ca-space-3);
  }
  .ts-row {
    display: flex;
    align-items: flex-end;
    gap: var(--ca-space-2);
    min-width: 0;
  }
  .ts-grow {
    flex: 1;
    min-width: 0;
  }
  .ts-caption,
  .ts-note {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
    overflow-wrap: anywhere;
  }
  .ts-note {
    color: var(--ca-text-primary);
  }
</style>
