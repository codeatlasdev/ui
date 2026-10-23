<script lang="ts">
  import { Button, Toaster, toast } from '@codeatlasdev/ui';

  function flood() {
    for (let i = 0; i < 10; i++) toast.error('Too many requests, retry later.');
  }

  function upload() {
    toast.info('Uploading report.pdf…', { id: 'upload', duration: 0 });
    setTimeout(() => toast.success('report.pdf uploaded.', { id: 'upload' }), 1500);
  }
</script>

<Toaster />

<Button variant="outlined" onclick={flood}>Fail 10 times</Button>
<Button variant="outlined" onclick={upload}>Upload with id</Button>
