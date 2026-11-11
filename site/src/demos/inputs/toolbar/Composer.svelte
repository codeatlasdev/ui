<script lang="ts">
  import { Bold, Italic, Paperclip, Smile, Sparkles } from '@lucide/svelte';
  import { Button, IconButton, Toolbar } from '@codeatlasdev/ui';

  let sent = $state(0);
</script>

<Toolbar aria-label="Message actions" overflow="menu">
  <IconButton variant="text" size="sm" aria-label="Attach"><Paperclip size={16} /></IconButton>
  <IconButton variant="text" size="sm" aria-label="Templates"><Sparkles size={16} /></IconButton>
  <IconButton variant="text" size="sm" aria-label="Emoji"><Smile size={16} /></IconButton>
  <IconButton variant="text" size="sm" aria-label="Bold"><Bold size={16} /></IconButton>
  <IconButton variant="text" size="sm" aria-label="Italic"><Italic size={16} /></IconButton>
  <span class="ca-toolbar-spacer"></span>
  <Button data-priority="primary" onclick={() => sent++}>Send{sent ? ` (${sent})` : ''}</Button>
</Toolbar>
