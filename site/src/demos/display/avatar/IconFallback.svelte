<script lang="ts">
  import { Avatar } from '@codeatlasdev/ui';
  import { Bot, Users } from '@lucide/svelte';
</script>

<!-- An image that fails to decode without a request: shows the fallback, logs no 404. -->
<Avatar src="data:image/png;base64,AAAA" alt="Family" size="lg" loading="lazy" referrerpolicy="no-referrer">
  {#snippet fallback()}<Users size={22} aria-hidden="true" />{/snippet}
</Avatar>
<Avatar alt="Support bot" size="lg">
  {#snippet fallback()}<Bot size={22} aria-hidden="true" />{/snippet}
</Avatar>
