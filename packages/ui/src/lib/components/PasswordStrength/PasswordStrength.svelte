<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { passwordStrength } from '../../i18n/groups/passwordStrength.js';
  import { type PasswordScore, passwordScore } from './score.js';
  const t = useMessages(passwordStrength);

  /**
   * PasswordStrength: a 3-step meter plus a text label for a password field.
   *
   * The label is a polite live region, so a screen reader hears the new strength once typing
   * pauses; the steps are decoration, colour is never the only signal (the text and the number of
   * filled steps say it too). Pair it with a `TextField type="password"`:
   *
   *   <TextField label="Password" type="password" bind:value />
   *   <PasswordStrength {value} />
   */
  interface Props {
    /** The password being typed. It is only read to compute the score and never stored or sent. */
    value?: string;
    /** Replaces the built-in `passwordScore`. Return 0 (empty) to 3 (strong). */
    score?: (value: string) => PasswordScore;
    /** Per-instance label text; unset keys use the i18n catalog. */
    labels?: Partial<Record<'empty' | 'weak' | 'fair' | 'strong', string>>;
    /** `inline`: the bar fills the row and the label sits to its right. Default `stacked` (bar above label). */
    layout?: 'stacked' | 'inline';
    /**
     * Shows nothing while the score is 0. The live region stays mounted (visually collapsed, still
     * in the accessibility tree), so the first strength after typing starts is announced.
     */
    hideWhenEmpty?: boolean;
    /** Set it to point a field's `aria-describedby` at the meter. */
    id?: string;
    class?: string;
  }

  let {
    value = '',
    score = passwordScore,
    labels,
    layout = 'stacked',
    hideWhenEmpty = false,
    id,
    class: className = ''
  }: Props = $props();

  const level = $derived(score(value));
  const KEYS = ['empty', 'weak', 'fair', 'strong'] as const;
  const hidden = $derived(hideWhenEmpty && level === 0);
  const text = $derived(hidden ? '' : (labels?.[KEYS[level]] ?? t().passwordStrength[KEYS[level]]));
</script>

<div
  class="ca-pwstrength {hidden ? 'ca-sr-only ' : ''}{className}"
  {id}
  data-score={level}
  data-layout={layout}
  data-empty={hidden ? '' : undefined}
>
  <div class="ca-pwstrength__bar" aria-hidden="true">
    {#each [1, 2, 3] as step}
      <span class="ca-pwstrength__seg" data-on={level >= step ? '' : undefined}></span>
    {/each}
  </div>
  <p class="ca-pwstrength__label" aria-live="polite" aria-atomic="true">
    {#if !hidden}<span class="ca-sr-only">{t().passwordStrength.name}: </span>{/if}<span class="ca-pwstrength__text">{text}</span>
  </p>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-pwstrength {
      display: grid;
      gap: var(--ca-pwstrength-gap, var(--ca-space-1-5));
      --_c: var(--ca-outline-default);
    }
    .ca-pwstrength[data-layout='inline'] {
      display: flex;
      align-items: center;
      gap: var(--ca-pwstrength-gap, var(--ca-space-3));
    }
    .ca-pwstrength[data-layout='inline'] .ca-pwstrength__bar { flex: 1 1 auto; min-width: 0; }
    .ca-pwstrength[data-score='1'] { --_c: var(--ca-semantic-error); }
    .ca-pwstrength[data-score='2'] { --_c: var(--ca-semantic-warning); }
    .ca-pwstrength[data-score='3'] { --_c: var(--ca-semantic-success); }

    .ca-pwstrength__bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--ca-space-1);
    }
    .ca-pwstrength__seg {
      height: var(--ca-space-1-5);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-pwstrength-empty-bg, var(--ca-outline-default));
      transition: background-color calc(var(--ca-duration-base) * var(--ca-motion-scale)) var(--ca-ease-standard);
    }
    .ca-pwstrength__seg[data-on] { background: var(--_c); }

    .ca-pwstrength__label {
      margin: 0;
      font-size: var(--ca-font-size-caption);
      line-height: var(--ca-pwstrength-label-leading, inherit);
      letter-spacing: var(--ca-pwstrength-label-tracking, inherit);
      color: var(--ca-text-secondary);
    }
}
</style>
