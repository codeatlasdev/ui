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
    /** Set it to point a field's `aria-describedby` at the meter. */
    id?: string;
    class?: string;
  }

  let { value = '', score = passwordScore, labels, id, class: className = '' }: Props = $props();

  const level = $derived(score(value));
  const KEYS = ['empty', 'weak', 'fair', 'strong'] as const;
  const text = $derived(labels?.[KEYS[level]] ?? t().passwordStrength[KEYS[level]]);
</script>

<div class="ca-pwstrength {className}" {id} data-score={level}>
  <div class="ca-pwstrength__bar" aria-hidden="true">
    {#each [1, 2, 3] as step}
      <span class="ca-pwstrength__seg" data-on={level >= step ? '' : undefined}></span>
    {/each}
  </div>
  <p class="ca-pwstrength__label" aria-live="polite" aria-atomic="true">
    <span class="ca-sr-only">{t().passwordStrength.name}: </span><span class="ca-pwstrength__text">{text}</span>
  </p>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-pwstrength {
      display: grid;
      gap: var(--ca-space-1-5);
      --_c: var(--ca-outline-default);
    }
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
      background: var(--ca-outline-default);
      transition: background-color calc(var(--ca-duration-base) * var(--ca-motion-scale)) var(--ca-ease-standard);
    }
    .ca-pwstrength__seg[data-on] { background: var(--_c); }

    .ca-pwstrength__label {
      margin: 0;
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
    }
}
</style>
