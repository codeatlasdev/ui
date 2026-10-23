<script lang="ts">
  import { Avatar, HoverCard, Stack } from '@codeatlasdev/ui';
</script>

<p class="line">
  Reviewed by
  <HoverCard>
    {#snippet triggerChild(props)}<a class="mention" href="#ada" {...props}>@ada</a>{/snippet}
    <Stack gap="2">
      <strong class="name">Ada Lovelace</strong>
      <span class="meta">Platform engineer. Joined March 2024.</span>
      <a class="more" href="#ada-profile">View profile</a>
    </Stack>
  </HoverCard>
  and merged this morning.
</p>

<style>
  .line { margin: 0; font-size: var(--ca-font-size-body1); color: var(--ca-text-primary); }
  .mention { color: var(--ca-brand-text); font-weight: 600; text-decoration: none; border-radius: var(--ca-radius-xs); }
  .mention:hover { text-decoration: underline; }
  .name { font-size: var(--ca-font-size-body1); }
  .meta { color: var(--ca-text-secondary); }
  .more { color: var(--ca-brand-text); }
</style>
