<script lang="ts">
  import type { Snippet } from 'svelte';
  import SkipLink from '../SkipLink/SkipLink.svelte';

  /**
   * AuthLayout — layout de duas colunas para páginas de autenticação.
   *
   * Coluna esquerda: fundo escuro com gradiente da brand, blobs animados,
   * logo e slot `panel` para conteúdo decorativo (quote, steps, etc.).
   *
   * Coluna direita: fundo claro, centraliza `children` (o formulário).
   *
   * Dentro do slot `panel`, use as CSS vars definidas aqui:
   *   --panel-text-primary   → oklch(1 0 0 / 0.95)
   *   --panel-text-secondary → oklch(1 0 0 / 0.60)
   *   --panel-text-tertiary  → oklch(1 0 0 / 0.35)
   *   --panel-surface        → oklch(1 0 0 / 0.10)
   *   --panel-surface-active → oklch(1 0 0 / 0.18)
   *   --panel-border         → oklch(1 0 0 / 0.14)
   *
   * Uso:
   *   <AuthLayout logoMark="CA" logoName="My App">   (or {#snippet brand()} for an SVG logo)
   *     {#snippet panel()}
   *       <blockquote class="quote">…</blockquote>
   *     {/snippet}
   *     <MyForm />
   *   </AuthLayout>
   */

  interface Props {
    /** Logo replacing the text mark (e.g. an SVG). */
    brand?:    Snippet;
    logoMark?: string;
    logoName?: string;
    logoHref?: string;
    /**
     * Abaixo de 768px o painel lateral some; `true` mostra uma faixa compacta
     * com a marca acima do formulário.
     */
    mobileBrand?: boolean;
    /** Conteúdo decorativo da coluna esquerda */
    panel?:    Snippet;
    /** Formulário — coluna direita */
    children?: Snippet;
  }

  let {
    brand,
    logoMark = 'CA',
    logoName = 'CodeAtlas UI',
    logoHref = '/',
    mobileBrand = true,
    panel,
    children,
  }: Props = $props();
</script>

<SkipLink />
<div class="ca-auth">
  <aside class="ca-auth__panel">
    <div class="ca-auth__panel-inner">
      <a href={logoHref} class="ca-auth__logo">
        {#if brand}
          {@render brand()}
        {:else}
          <div class="ca-auth__mark" aria-hidden="true">{logoMark}</div>
        {/if}
        <span class="ca-auth__name">{logoName}</span>
      </a>

      {#if panel}
        <div
          class="ca-auth__slot"
          style="
            --panel-text-primary:   oklch(1 0 0 / 0.95);
            --panel-text-secondary: oklch(1 0 0 / 0.60);
            --panel-text-tertiary:  oklch(1 0 0 / 0.35);
            --panel-surface:        oklch(1 0 0 / 0.10);
            --panel-surface-active: oklch(1 0 0 / 0.18);
            --panel-border:         oklch(1 0 0 / 0.14);
          "
        >
          {@render panel()}
        </div>
      {/if}

      <div class="ca-auth__blobs" aria-hidden="true">
        <div class="ca-auth__blob ca-auth__blob--a"></div>
        <div class="ca-auth__blob ca-auth__blob--b"></div>
        <div class="ca-auth__blob ca-auth__blob--c"></div>
      </div>
    </div>
  </aside>

  <main class="ca-auth__col" id="main" tabindex="-1">
    {#if mobileBrand}
      <a href={logoHref} class="ca-auth__mobile-brand">
        {#if brand}
          {@render brand()}
        {:else}
          <div class="ca-auth__mobile-mark" aria-hidden="true">{logoMark}</div>
        {/if}
        <span class="ca-auth__mobile-name">{logoName}</span>
      </a>
    {/if}
    {@render children?.()}
  </main>
</div>

<style>
  .ca-auth {
    display: flex;
    min-height: var(--ca-vh);
    background: var(--ca-surface-base);
  }

  /* ── Coluna esquerda — sempre escura ──────────────────────── */
  .ca-auth__panel {
    flex: 0 0 44%;
    position: relative;
    overflow: hidden;
    background: linear-gradient(
      145deg,
      color-mix(in oklab, var(--ca-brand-main) 60%, oklch(0.10 0 0)) 0%,
      color-mix(in oklab, var(--ca-brand-main) 30%, oklch(0.08 0 0)) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Same selector as the rule above: a :global() override loses to the scoped class. */
  @media (max-width: 768px) {
    .ca-auth__panel { display: none; }
  }

  .ca-auth__panel-inner {
    position: relative;
    z-index: 1;
    padding: 48px;
    display: flex;
    flex-direction: column;
    gap: 40px;
    width: 100%;
    max-width: 420px;
  }

  /* ── Logo ─────────────────────────────────────────────────── */
  .ca-auth__logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .ca-auth__mark {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: oklch(1 0 0 / 0.14);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: var(--ca-font-size-body2);
    color: oklch(1 0 0 / 0.95);
    letter-spacing: -0.03em;
    flex-shrink: 0;
  }

  .ca-auth__name {
    font-size: var(--ca-font-size-lg);
    font-weight: 700;
    color: oklch(1 0 0 / 0.90);
  }

  /* ── Slot — vars disponíveis pro conteúdo decorativo ──────── */
  .ca-auth__slot {
    --panel-text-primary:   oklch(1 0 0 / 0.95);
    --panel-text-secondary: oklch(1 0 0 / 0.60);
    --panel-text-tertiary:  oklch(1 0 0 / 0.35);
    --panel-surface:        oklch(1 0 0 / 0.10);
    --panel-surface-active: oklch(1 0 0 / 0.18);
    --panel-border:         oklch(1 0 0 / 0.14);
  }

  /* ── Blobs animados ───────────────────────────────────────── */
  .ca-auth__blobs {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .ca-auth__blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(64px);
    opacity: 0.18;
  }

  .ca-auth__blob--a {
    width: 320px; height: 320px;
    background: color-mix(in oklab, var(--ca-brand-main) 70%, oklch(0.90 0 0));
    top: -80px; right: -80px;
    animation: ca-auth-float 9s ease-in-out infinite;
  }
  .ca-auth__blob--b {
    width: 240px; height: 240px;
    background: color-mix(in oklch, var(--ca-brand-main) 50%, oklch(0.60 0.18 235));
    bottom: 60px; left: -60px;
    animation: ca-auth-float 12s ease-in-out infinite reverse;
  }
  .ca-auth__blob--c {
    width: 180px; height: 180px;
    background: color-mix(in oklch, var(--ca-brand-main) 40%, oklch(0.85 0.12 150));
    bottom: -40px; right: 60px;
    animation: ca-auth-float 15s ease-in-out infinite 3s;
  }

  @keyframes ca-auth-float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(12px, -18px) scale(1.04); }
    66%       { transform: translate(-8px, 10px) scale(0.97); }
  }

  /* ── Coluna direita ───────────────────────────────────────── */
  .ca-auth__col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    background: var(--ca-surface-base);
  }

  /* ── Faixa de marca mobile (o painel lateral está oculto) ─── */
  .ca-auth__mobile-brand {
    display: none;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    text-decoration: none;
    color: var(--ca-text-primary);
  }

  .ca-auth__mobile-mark {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--ca-brand-main);
    color: var(--ca-brand-contrast, oklch(1 0 0));
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: var(--ca-font-size-caption);
    letter-spacing: -0.03em;
    flex-shrink: 0;
  }

  .ca-auth__mobile-name {
    font-size: var(--ca-font-size-body1);
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  @media (max-width: 768px) {
    .ca-auth__col {
      padding-top: calc(40px + var(--ca-safe-top));
      padding-bottom: calc(40px + var(--ca-safe-bottom));
      padding-left: max(24px, var(--ca-safe-left));
      padding-right: max(24px, var(--ca-safe-right));
    }
    .ca-auth__mobile-brand { display: flex; }
  }

  /* ── Shared auth utility classes — available inside any AuthLayout slot ── */
  :global(.auth-quote) { margin: 0; max-width: 380px; }
  :global(.auth-quote__text) {
    font-size: var(--ca-font-size-xl); line-height: 1.4; font-weight: 500;
    letter-spacing: -0.01em; margin: 0;
    color: var(--panel-text-primary, oklch(1 0 0 / 0.95));
  }
  :global(.auth-quote__attr) {
    font-size: var(--ca-font-size-body2); margin-top: 16px;
    color: var(--panel-text-secondary, oklch(1 0 0 / 0.60));
  }
</style>
