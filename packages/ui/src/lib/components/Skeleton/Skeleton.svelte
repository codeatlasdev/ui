<script lang="ts">
  interface Props {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    rows?: number;
    class?: string;
  }
  let {
    variant = 'text',
    width,
    height,
    rows = 1,
    class: className = '',
  }: Props = $props();

  function px(v: string | number | undefined) {
    if (v === undefined) return undefined;
    return typeof v === 'number' ? `${v}px` : v;
  }

  let style = $derived(
    [px(width) && `width:${px(width)}`, px(height) && `height:${px(height)}`]
      .filter(Boolean)
      .join(';')
  );
</script>

{#if rows > 1}
  <div class="ca-skeleton-rows">
    {#each { length: rows } as _, i}
      <div
        class="ca-skeleton ca-skeleton--{variant} {className}"
        style={i === rows - 1 && variant === 'text' ? `${style};width:60%` : style}
        aria-hidden="true"
      ></div>
    {/each}
  </div>
{:else}
  <div
    class="ca-skeleton ca-skeleton--{variant} {className}"
    {style}
    aria-hidden="true"
  ></div>
{/if}

<style>
  .ca-skeleton {
    background: linear-gradient(
      90deg,
      var(--ca-action-hover) 25%,
      var(--ca-outline-subtle) 50%,
      var(--ca-action-hover) 75%
    );
    background-size: 200% 100%;
    animation: ca-shimmer var(--ca-duration-loop) var(--ca-ease-standard) infinite;
  }
  .ca-skeleton--text {
    height: 1em;
    border-radius: var(--ca-radius-sm);
    width: 100%;
    margin-block: 0.25em;
  }
  .ca-skeleton--circular {
    border-radius: 50%;
    width: var(--ca-space-10);
    height: var(--ca-space-10);
  }
  .ca-skeleton--rectangular {
    border-radius: 0;
    width: 100%;
    height: calc(var(--ca-space-24) + var(--ca-space-6));
  }
  .ca-skeleton--rounded {
    border-radius: var(--ca-radius-md);
    width: 100%;
    height: calc(var(--ca-space-24) + var(--ca-space-6));
  }
  .ca-skeleton-rows {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-1);
  }
  @keyframes ca-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ca-skeleton {
      animation: none;
      opacity: 0.5;
    }
  }
</style>
