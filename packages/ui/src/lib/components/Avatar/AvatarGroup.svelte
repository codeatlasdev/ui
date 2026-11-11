<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { avatarGroup } from '../../i18n/groups/avatarGroup.js';
  import Avatar from './Avatar.svelte';
  const t = useMessages(avatarGroup);

  /**
   * AvatarGroup: overlapping avatars with a "+N" chip for the ones `max` hides.
   *
   * <AvatarGroup items={[{ name: 'Ana Lima', src: '/ana.jpg' }, { name: 'Bruno Souza' }]} max={3} label="Reviewers" />
   * <AvatarGroup label="Reviewers" size="sm"><Avatar alt="Ana Lima" size="sm" /></AvatarGroup>
   *
   * The group is `role="group"` with a name; each avatar keeps its own name, and the chip is an image named
   * "N more" (localized), so a screen reader hears who is shown and how many are not.
   *
   * Tokens: `--ca-avatar-group-overlap` (how far each avatar slides under the previous one; default 20% of the
   * size), `--ca-avatar-group-ring` (the colour of the 2px ring that separates overlapping avatars; default
   * `--ca-bg-body`, so set it to the surface the group sits on).
   */

  type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

  interface Item {
    /** Full name: the avatar's accessible name and the source of its initials. */
    name: string;
    src?: string;
  }

  interface Props {
    /** The avatars to show. Alternative to `children`. */
    items?: Item[];
    /** At most this many avatars are drawn, the rest become one "+N" chip. Applies to `items` only. */
    max?: number;
    /** Same sizes as `Avatar`; the chip and every avatar in `items` use it. Give children the same `size`. */
    size?: Size;
    shape?: 'circle' | 'rounded';
    /** Name of the group. Default: the catalog's "Avatars". */
    label?: string;
    /** Accessible name of the "+N" chip, from the number hidden. Default: the catalog's "N more". */
    moreLabel?: (hidden: number) => string;
    class?: string;
    /** Avatars drawn by the caller instead of `items`; they overlap like `items` do, and `max` does not apply. */
    children?: Snippet;
  }

  let {
    items = [],
    max,
    size = 'md',
    shape = 'circle',
    label,
    moreLabel,
    class: className = '',
    children,
  }: Props = $props();

  const limit = $derived(max !== undefined && max >= 0 ? Math.floor(max) : items.length);
  const shown = $derived(items.slice(0, limit));
  const hidden = $derived(items.length - shown.length);
  const empty = $derived(!children && items.length === 0);
  const chipName = $derived((moreLabel ?? t().avatarGroup.more)(hidden));

  // The same pixel sizes as Avatar, so the chip is exactly as big as the avatars beside it.
  const SIZES: Record<string, number> = { xs: 20, sm: 28, md: 36, lg: 48, xl: 64 };
  const px = $derived(typeof size === 'number' ? size : (SIZES[size] ?? 36));
  const radius = $derived(shape === 'rounded' ? `${Math.round(px * 0.22)}px` : '50%');
  const chipText = $derived(`+${hidden}`);
</script>

{#if !empty}
  <div
    class="ca-avatar-group {className}"
    role="group"
    aria-label={label ?? t().avatarGroup.label}
    style="--ca-avatar-group-size:{px}px;--ca-avatar-group-radius:{radius};"
  >
    {#if children}
      {@render children()}
    {:else}
      {#each shown as item, i (i)}
        <!-- The item carries the name (a fallback avatar has none of its own); the avatar inside is
             decorative so a photo is not announced twice. -->
        <span class="ca-avatar-group__item" role="img" aria-label={item.name}>
          <Avatar alt={item.name} src={item.src} {size} {shape} decorative />
        </span>
      {/each}
      {#if hidden > 0}
        <span class="ca-avatar-group__item" role="img" aria-label={chipName}>
          <span
            class="ca-avatar ca-avatar-group__more"
            data-tone="neutral"
            data-size={typeof size === 'string' ? size : undefined}
            aria-hidden="true"
            style="--av-size:{px}px;--av-radius:{radius};--av-fs:{Math.round(px * 0.36)}px;"
          >
            <span class="ca-avatar__fallback" aria-hidden="true">{chipText}</span>
          </span>
        </span>
      {/if}
    {/if}
  </div>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-avatar-group {
      display: inline-flex;
      align-items: center;
      /* Each avatar slides under the one before it by this much: 20% of the avatar unless the token says so. */
      --ca-avatar-group-shift: var(--ca-avatar-group-overlap, calc(var(--ca-avatar-group-size) * 0.2));
    }

    /* An avatar (`items`) sits in a wrapper; one passed as a child is the direct child. Both get the
       overlap, the ring and the stacking order. The ring is drawn outside the avatar, so the overlap
       reads as a cut-out and adds no layout shift. */
    .ca-avatar-group > :global(*) {
      position: relative;
      border-radius: var(--ca-avatar-group-radius);
      box-shadow: 0 0 0 var(--ca-border-width-strong) var(--ca-avatar-group-ring, var(--ca-bg-body));
    }
    .ca-avatar-group > :global(* + *) { margin-inline-start: calc(-1 * var(--ca-avatar-group-shift)); }

    .ca-avatar-group__item { display: inline-flex; }

    /* Earlier avatars stay on top of later ones, like a hand of cards fanned to the right. */
    .ca-avatar-group > :global(:nth-child(1)) { z-index: 9; }
    .ca-avatar-group > :global(:nth-child(2)) { z-index: 8; }
    .ca-avatar-group > :global(:nth-child(3)) { z-index: 7; }
    .ca-avatar-group > :global(:nth-child(4)) { z-index: 6; }
    .ca-avatar-group > :global(:nth-child(5)) { z-index: 5; }
    .ca-avatar-group > :global(:nth-child(n + 6)) { z-index: 4; }
}
</style>
