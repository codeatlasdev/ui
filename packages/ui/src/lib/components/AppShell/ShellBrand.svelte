<script lang="ts">
  /**
   * The shell's brand as a link (`brandHref`): one `<a>` around the consumer's `brand` snippet, in the
   * rail and in the mobile header. The logo keeps its own size; the 44px hit area on a coarse pointer
   * is an overhang (a pseudo-element), so nothing in the layout moves. The focus ring is the library's.
   */
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    label?: string;
    children: Snippet;
  }

  let { href, label, children }: Props = $props();
</script>

<a class="ca-shell-brand" {href} aria-label={label}>{@render children()}</a>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-shell-brand {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: inherit;
      text-decoration: none;
      border-radius: var(--ca-radius-control);
    }

    .ca-shell-brand:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }

    @media (pointer: coarse) {
      .ca-shell-brand { position: relative; }
      .ca-shell-brand::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: var(--ca-touch-target);
        height: var(--ca-touch-target);
        translate: -50% -50%;
      }
    }
}
</style>
