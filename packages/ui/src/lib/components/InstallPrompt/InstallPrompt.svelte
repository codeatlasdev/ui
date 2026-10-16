<script lang="ts">
  import { Download, Share, SquarePlus, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { useT } from '../../i18n/state.svelte.js';
  import { storageGet, storageSet } from '../../utils/local-storage.js';
  import Button from '../Button/Button.svelte';

  /** The Chromium event: not in `lib.dom`, fired when the page meets the installability criteria. */
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  interface Props {
    /**
     * Which prompt to offer. `auto` picks from the browser: the native install button where
     * `beforeinstallprompt` fires (Chromium), the Share-sheet instructions on iOS Safari (it has no
     * install API). Pass `ios` or `native` to force one, e.g. to document or test it.
     * @default "auto"
     */
    mode?: 'auto' | 'native' | 'ios';
    /** Days the prompt stays hidden after the user dismisses it. @default 14 */
    dismissDays?: number;
    /** `localStorage` key of the dismissal. @default "ca-install-dismissed" */
    storageKey?: string;
    /** Called with the user's choice in the browser's install dialog. */
    onchoice?: (outcome: 'accepted' | 'dismissed') => void;
    /** Called when the user closes the banner with the close button. */
    ondismiss?: () => void;
    class?: string;
  }

  let {
    mode = 'auto',
    dismissDays = 14,
    storageKey = 'ca-install-dismissed',
    onchoice,
    ondismiss,
    class: className = '',
  }: Props = $props();

  const t = useT();

  let deferred = $state<BeforeInstallPromptEvent | null>(null);
  let ios = $state(false);
  let hidden = $state(true);

  function installed(): boolean {
    return (
      matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  onMount(() => {
    if (installed()) return;
    const until = storageGet<number>(storageKey, 0);
    if (until > Date.now()) return;

    // iPadOS 13+ reports a Mac user agent: a touch-capable "Mac" is an iPad.
    const apple =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (mode === 'ios' || (mode === 'auto' && apple)) {
      ios = true;
      hidden = false;
      return;
    }

    if (mode === 'native') hidden = false;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as BeforeInstallPromptEvent;
      hidden = false;
    };
    const onInstalled = () => {
      deferred = null;
      hidden = true;
    };
    addEventListener('beforeinstallprompt', onPrompt);
    addEventListener('appinstalled', onInstalled);
    return () => {
      removeEventListener('beforeinstallprompt', onPrompt);
      removeEventListener('appinstalled', onInstalled);
    };
  });

  async function install() {
    if (!deferred) return;
    const event = deferred;
    // The event can be used once: drop it whatever the user answers.
    deferred = null;
    await event.prompt();
    const { outcome } = await event.userChoice;
    onchoice?.(outcome);
    hidden = true;
  }

  function dismiss() {
    storageSet(storageKey, Date.now() + dismissDays * 86_400_000);
    hidden = true;
    ondismiss?.();
  }
</script>

{#if !hidden}
  <section class="ca-install {className}" aria-labelledby="ca-install-title">
    <span class="ca-install__icon" aria-hidden="true"><Download size={20} stroke-width={2} /></span>
    <div class="ca-install__body">
      <p class="ca-install__title" id="ca-install-title">{t().installPrompt.title}</p>
      {#if ios}
        <ol class="ca-install__steps">
          <li>
            {t().installPrompt.iosShare}
            <span class="ca-install__glyph" aria-hidden="true"><Share size={14} stroke-width={2} /></span>
          </li>
          <li>
            {t().installPrompt.iosAdd}
            <span class="ca-install__glyph" aria-hidden="true"
              ><SquarePlus size={14} stroke-width={2} /></span
            >
          </li>
        </ol>
      {:else}
        <p class="ca-install__text">{t().installPrompt.description}</p>
      {/if}
    </div>
    {#if !ios}
      <Button size="sm" onclick={install} disabled={!deferred}>{t().installPrompt.install}</Button>
    {/if}
    <button class="ca-install__close" type="button" aria-label={t().installPrompt.dismiss} onclick={dismiss}>
      <X size={16} />
    </button>
  </section>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-install {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ca-space-3);
      padding: var(--ca-space-3) var(--ca-space-3) var(--ca-space-3) var(--ca-space-4);
      border-radius: var(--ca-radius-md);
      border: var(--ca-border-width) solid var(--ca-outline-default);
      background: var(--ca-surface-raised);
      color: var(--ca-text-primary);
      box-shadow: var(--ca-shadow-md);
      /* Never under the notch or the home indicator when pinned by the app. */
      padding-inline-end: max(var(--ca-space-3), var(--ca-safe-right));
    }

    .ca-install__icon {
      flex-shrink: 0;
      display: flex;
      color: var(--ca-brand-main);
    }

    .ca-install__body {
      flex: 1 1 calc(var(--ca-space-8) * 5);
      min-width: 0;
    }

    .ca-install__title {
      margin: 0;
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-semibold);
    }

    .ca-install__text,
    .ca-install__steps {
      margin: var(--ca-space-0-5) 0 0;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      line-height: var(--ca-line-height-relaxed);
    }

    .ca-install__steps {
      padding-inline-start: var(--ca-space-5);
    }

    .ca-install__glyph {
      display: inline-flex;
      vertical-align: middle;
      color: var(--ca-brand-main);
    }

    .ca-install__close {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--ca-space-7);
      height: var(--ca-space-7);
      border-radius: var(--ca-radius-sm);
      border: none;
      background: transparent;
      color: inherit;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity var(--ca-duration-fast) var(--ca-ease-standard),
                  background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-install__close:hover {
      opacity: 1;
      background: var(--ca-action-hover);
    }

    .ca-install__close:focus-visible {
      outline: var(--ca-border-width-focus) solid currentColor;
      outline-offset: var(--ca-border-width);
      opacity: 1;
    }
}
</style>
