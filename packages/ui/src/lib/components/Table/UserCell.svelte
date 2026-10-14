<script lang="ts">
  import Avatar from '../Avatar/Avatar.svelte';
  interface Props {
    name: string;
    email?: string;
    src?: string;
    size?: 'sm' | 'md';
  }
  let { name, email, src, size = 'sm' }: Props = $props();
</script>

<div class="ca-user-cell">
  <Avatar alt={name} {src} {size} />
  <div class="ca-user-cell__info">
    <span class="ca-user-cell__name">{name}</span>
    {#if email}<span class="ca-user-cell__email">{email}</span>{/if}
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-user-cell {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2-5);
    }
    .ca-user-cell__info {
      display: flex;
      flex-direction: column;
      gap: var(--ca-border-width);
      min-width: 0;
    }
    .ca-user-cell__name {
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
      font-size: var(--ca-font-size-body2);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ca-user-cell__email {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
}
</style>
