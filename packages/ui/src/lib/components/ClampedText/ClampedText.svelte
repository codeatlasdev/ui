<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { createIds } from '../../primitives/index.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { clampedText } from '../../i18n/groups/clampedText.js';
  const t = useMessages(clampedText);

  /**
   * ClampedText: a long text cut to `lines` lines, with a "Show more" toggle that appears only when
   * the text really overflows. The overflow is measured (`scrollHeight > clientHeight`) and measured
   * again when the width, the text, the fonts or `lines` change.
   *
   * The clamp is CSS (`line-clamp`), so the whole text is in the server render and screen readers
   * read all of it; the toggle (`aria-expanded`, `aria-controls` on the text) is the visual way to
   * the rest. Expanding grows the text downward and keeps the page where it is; collapsing scrolls
   * the toggle back into view when it would end above the fold. There is no height animation.
   *
   *   <ClampedText lines={6}>{post.body}</ClampedText>
   */
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
    /** Lines shown while collapsed (at least 1). */
    lines?: number;
    /** Whether the whole text is shown. */
    expanded?: boolean;
    /** Toggle text while collapsed. Defaults to the catalog's "Show more". */
    moreLabel?: string;
    /** Toggle text while expanded. Defaults to the catalog's "Show less". */
    lessLabel?: string;
    class?: string;
    /** The text: inline content or paragraphs. */
    children: Snippet;
  }

  let {
    lines = 3,
    expanded = $bindable(false),
    moreLabel,
    lessLabel,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const ids = createIds(uid);
  const count = $derived(Math.max(1, Math.floor(lines)));

  let text = $state<HTMLDivElement>();
  let toggleButton = $state<HTMLButtonElement>();
  let overflowing = $state(false);

  /** Would the text overflow `count` lines? While expanded the clamp is applied for the read only:
   *  added and removed in the same task, so it is never painted. */
  function measure() {
    const el = text;
    if (!el) return;
    if (expanded) el.classList.add('ca-x-measure');
    overflowing = el.scrollHeight > el.clientHeight + 1;
    el.classList.remove('ca-x-measure');
  }

  $effect(() => {
    void count;
    void expanded;
    measure();
  });

  // Width (ResizeObserver), text (MutationObserver) and web fonts change where the lines break.
  $effect(() => {
    const el = text;
    if (!el) return;
    const resize = new ResizeObserver(() => measure());
    resize.observe(el);
    const mutation = new MutationObserver(() => measure());
    mutation.observe(el, { childList: true, characterData: true, subtree: true });
    const fonts = document.fonts;
    fonts?.addEventListener('loadingdone', measure);
    return () => {
      resize.disconnect();
      mutation.disconnect();
      fonts?.removeEventListener('loadingdone', measure);
    };
  });

  /** When the text has scrolled above the fold and only the toggle is in view, expanding inserts
   *  lines above everything visible, and the browser's scroll anchoring would scroll the page by
   *  their height to keep what is below still: the revealed lines would land out of sight. Anchoring
   *  is paused on every ancestor (each scroller included) until the expanded layout has painted. */
  function pauseScrollAnchoring(from: Element) {
    const paused: Element[] = [];
    for (let el = from.parentElement; el; el = el.parentElement) {
      if (el.classList.contains('ca-x-anchor-off')) continue;
      el.classList.add('ca-x-anchor-off');
      paused.push(el);
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        for (const el of paused) el.classList.remove('ca-x-anchor-off');
      })
    );
  }

  async function toggle() {
    if (!expanded) {
      if (toggleButton) pauseScrollAnchoring(toggleButton);
      expanded = true;
      return;
    }
    expanded = false;
    // A long text collapsed from its end leaves the toggle above the fold: bring it back.
    await tick();
    toggleButton?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
</script>

<div {...rest} class="ca-clamped-text {className}" data-state={expanded ? 'expanded' : 'collapsed'}>
  <div bind:this={text} id={ids.part('text')} class="ca-clamped-text__content" style="--_lines: {count}">
    {@render children()}
  </div>
  {#if overflowing}
    <button
      bind:this={toggleButton}
      type="button"
      class="ca-clamped-text__toggle"
      aria-expanded={expanded}
      aria-controls={ids.part('text')}
      onclick={toggle}
    >
      {expanded ? (lessLabel ?? t().clampedText.less) : (moreLabel ?? t().clampedText.more)}
    </button>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-clamped-text {
      min-width: 0;
    }

    /* The same clamp as the opt-in `.ca-clamp` utility (styles/text.css), owned by the component. */
    .ca-clamped-text[data-state='collapsed'] .ca-clamped-text__content,
    :global(.ca-clamped-text__content.ca-x-measure) {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: var(--_lines);
      line-clamp: var(--_lines);
      overflow: hidden;
    }

    .ca-clamped-text__toggle {
      display: inline-flex;
      align-items: center;
      margin-top: var(--ca-space-1);
      padding: 0;
      border: 0;
      border-radius: var(--ca-radius-xs);
      background: none;
      color: var(--ca-brand-text);
      font-weight: var(--ca-font-weight-medium);
    }

    /* Set on the ancestors for the frames of an expansion only (pauseScrollAnchoring). */
    :global(.ca-x-anchor-off) {
      overflow-anchor: none;
    }

    .ca-clamped-text__toggle:hover {
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }

    /* Touch: a 44px target without growing the text. */
    @media (pointer: coarse) {
      .ca-clamped-text__toggle { min-height: var(--ca-touch-target); }
    }
}
</style>
