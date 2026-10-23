<script lang="ts">
  import { Button, Toaster, toast } from '@codeatlasdev/ui';
</script>

<Toaster />

<Button variant="outlined" onclick={() => toast.success('Task completed', { description: 'Next step scheduled for tomorrow 09:00' })}>
  With description
</Button>
<Button
  variant="outlined"
  onclick={() =>
    toast.warning('Sequence paused for Acme', {
      action: { label: 'Mark as qualified', onClick: () => toast.success('Marked as qualified.') },
    })}
>
  With action
</Button>
<Button
  variant="outlined"
  onclick={() =>
    toast.info('You have 7 tasks today', {
      description: 'Three are due before noon.',
      action: { label: 'Open Today', onClick: () => toast.success('Opening the queue…') },
    })}
>
  Both
</Button>
