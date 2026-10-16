<script lang="ts">
  import { MotionStage, announce } from '@codeatlasdev/ui';
  import { ShoppingBag } from '@lucide/svelte';

  let count = $state(2);
  // Bumped on every add: remounts the flying dot and replays the badge bump.
  let flight = $state(0);
  let flying = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function add() {
    flight += 1;
    flying = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      count += 1;
      flying = false;
      announce(`Cart: ${count} items`);
    }, 520);
  }

  const autoplay = (node: HTMLElement) => {
    clearTimeout(timer);
    count = 2;
    flying = false;
    const t = setTimeout(add, 500);
    return () => {
      clearTimeout(t);
      clearTimeout(timer);
    };
  };
</script>

<MotionStage label="Add to cart: a dot flies to the cart and its count bumps" loop={2400}>
  {#snippet children(m)}
    {#key m.cycle}
      <div class="cart" {@attach (node) => (m.playing && !m.reduced ? autoplay(node) : undefined)}>
        <div class="cart__item">
          <span class="cart__thumb" aria-hidden="true"></span>
          <div class="cart__info">
            <p class="cart__name">Linen overshirt</p>
            <p class="cart__price">$89.00</p>
          </div>
          <button type="button" class="cart__add" onclick={add}>Add to cart</button>
          {#if flying && !m.reduced}
            {#key flight}<span class="cart__dot" aria-hidden="true"></span>{/key}
          {/if}
        </div>
        <div class="cart__bag" role="img" aria-label="Cart, {count} items">
          <ShoppingBag size={22} aria-hidden="true" />
          {#key count}
            <span class="cart__badge" class:cart__badge--bump={!m.reduced && count > 2} aria-hidden="true">{count}</span>
          {/key}
        </div>
      </div>
    {/key}
  {/snippet}
</MotionStage>

<style>
  .cart {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--ca-space-4);
    inline-size: 100%;
    max-inline-size: 360px;
  }
  .cart__item {
    position: relative;
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--ca-space-3);
    padding: var(--ca-space-3);
    border: var(--ca-border-width-thin) solid var(--ca-outline-default);
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-raised);
    min-inline-size: 0;
  }
  .cart__thumb {
    flex: none;
    inline-size: 44px;
    block-size: 44px;
    border-radius: var(--ca-radius-md);
    background: var(--ca-brand-light);
  }
  .cart__info {
    flex: 1;
    min-inline-size: 0;
  }
  .cart__name,
  .cart__price {
    margin: 0;
  }
  .cart__name {
    font-weight: var(--ca-font-weight-semibold);
    font-size: var(--ca-font-size-body2);
  }
  .cart__price {
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-caption);
  }
  .cart__add {
    min-block-size: var(--ca-touch-target);
    padding-inline: var(--ca-space-3);
    border: none;
    border-radius: var(--ca-radius-control);
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    font: inherit;
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-medium);
    cursor: pointer;
    white-space: nowrap;
  }
  .cart__add:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: var(--ca-focus-ring-offset);
  }
  .cart__bag {
    position: relative;
    display: grid;
    place-items: center;
    flex: none;
    inline-size: var(--ca-touch-target);
    block-size: var(--ca-touch-target);
    color: var(--ca-text-primary);
  }
  .cart__badge {
    position: absolute;
    inset-block-start: 2px;
    inset-inline-end: 0;
    display: grid;
    place-items: center;
    min-inline-size: 18px;
    block-size: 18px;
    padding-inline: var(--ca-space-1);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    font-size: var(--ca-font-size-nano);
    font-weight: var(--ca-font-weight-bold);
    font-variant-numeric: tabular-nums;
  }
  .cart__badge--bump {
    animation: cart-bump 360ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  /* The dot leaves the Add button (right of the item) and lands on the bag. */
  .cart__dot {
    position: absolute;
    inset-inline-end: var(--ca-space-6);
    inset-block-start: 50%;
    inline-size: 12px;
    block-size: 12px;
    margin-block-start: -6px;
    border-radius: var(--ca-radius-pill);
    background: var(--ca-brand-fill);
    pointer-events: none;
    animation: cart-fly 520ms cubic-bezier(0.4, 0, 0.2, 1) both;
  }
  @keyframes cart-fly {
    0% { opacity: 1; transform: translate(0, 0) scale(1); }
    60% { opacity: 1; transform: translate(40px, -26px) scale(0.9); }
    100% { opacity: 0; transform: translate(72px, -4px) scale(0.4); }
  }
  @keyframes cart-bump {
    0% { transform: scale(1); }
    45% { transform: scale(1.5); }
    100% { transform: scale(1); }
  }
</style>
