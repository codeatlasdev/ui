<script lang="ts" module>
  /** What `bind:handle` gives you. */
  export interface TurnstileHandle {
    /** The current token, or `undefined` before the check passed, after it expired or after `reset()`. */
    getToken(): string | undefined;
    /** Starts a fresh challenge and clears the token. Call it after a failed submit: a token is single-use. */
    reset(): void;
  }
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import { useLocale, useMessages } from '../i18n/state.svelte.js';
  import { turnstile } from '../i18n/groups/turnstile.js';
  import { colorScheme } from '../stores/color-scheme.svelte.js';
  import { loadTurnstile, type TurnstileApi, type TurnstileRenderOptions } from './turnstile-loader.js';
  const t = useMessages(turnstile);
  const locale = useLocale();

  /**
   * Turnstile: Cloudflare's captcha as an explicit-render widget.
   *
   * It loads the vendor script on demand (no dependency, nothing on the server, once per page),
   * follows the active colour scheme and UI language, re-renders when either changes and removes
   * the widget on unmount. Without a `siteKey` it renders and loads nothing, so a dev environment
   * needs no key; verify the token on your server either way.
   *
   *   <Turnstile siteKey={PUBLIC_TURNSTILE_KEY} action="sign-in" bind:handle />
   *   // on submit: const token = handle?.getToken(); on a failed submit: handle?.reset()
   */
  interface Props {
    /** Public site key. Empty or unset: the component does nothing. */
    siteKey?: string;
    /** Label of the flow (`sign-in`), echoed back when you verify the token. */
    action?: string;
    /** Opaque data echoed back when you verify the token. */
    cData?: string;
    /** `auto` (default) follows the active colour scheme; `light` / `dark` force one. */
    theme?: 'auto' | 'light' | 'dark';
    /** Widget language tag. Defaults to the active UI locale (`pt-BR` becomes `pt-br`). */
    language?: string;
    size?: 'normal' | 'flexible' | 'compact';
    appearance?: 'always' | 'execute' | 'interaction-only';
    /** `bind:handle` for `getToken()` and `reset()`. */
    handle?: TurnstileHandle;
    /** `bind:token`: the current token, `undefined` while there is none. */
    token?: string;
    onverify?: (token: string) => void;
    onexpire?: () => void;
    /** The widget could not run; `code` is Cloudflare's error code. */
    onerror?: (code: string) => void;
    /** CSP nonce for the vendor script tag. */
    nonce?: string;
    class?: string;
  }

  let {
    siteKey,
    action,
    cData,
    theme = 'auto',
    language,
    size,
    appearance,
    handle = $bindable(),
    token = $bindable(),
    onverify,
    onexpire,
    onerror,
    nonce,
    class: className = '',
  }: Props = $props();

  let container = $state<HTMLElement>();
  let api: TurnstileApi | undefined;
  let widgetId: string | undefined;

  const resolvedTheme = $derived(theme === 'auto' ? colorScheme.resolved : theme);
  const resolvedLanguage = $derived(language ?? locale().toLowerCase());

  function drop() {
    if (widgetId !== undefined) api?.remove(widgetId);
    widgetId = undefined;
    token = undefined;
  }

  handle = {
    getToken: () => token,
    reset() {
      token = undefined;
      if (widgetId !== undefined) api?.reset(widgetId);
    },
  };

  // One effect owns the widget: any input it reads (key, action, theme, language…) re-renders it.
  $effect(() => {
    const el = container;
    const options: TurnstileRenderOptions | undefined = siteKey
      ? {
          sitekey: siteKey,
          action,
          cData,
          theme: resolvedTheme,
          language: resolvedLanguage,
          size,
          appearance,
          callback: (v) => {
            token = v;
            untrack(() => onverify?.(v));
          },
          'expired-callback': () => {
            token = undefined;
            untrack(() => onexpire?.());
          },
          'error-callback': (code) => {
            token = undefined;
            untrack(() => onerror?.(code));
          },
        }
      : undefined;
    if (!el || !options) return;

    let cancelled = false;
    loadTurnstile({ nonce }).then(
      (loaded) => {
        if (cancelled) return;
        api = loaded;
        widgetId = loaded.render(el, options);
      },
      (e: Error) => {
        if (!cancelled) untrack(() => onerror?.(e.message));
      }
    );
    return () => {
      cancelled = true;
      drop();
    };
  });
</script>

{#if siteKey}
  <div class="ca-turnstile {className}" bind:this={container} role="group" aria-label={t().turnstile.label}></div>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-turnstile {
      display: flex;
      min-height: var(--ca-control-height);
    }
}
</style>
