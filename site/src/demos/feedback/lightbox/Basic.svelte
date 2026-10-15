<script lang="ts">
  import { Button, Lightbox } from '@codeatlasdev/ui';

  const photo =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#334155"/><circle cx="320" cy="200" r="90" fill="#94a3b8"/></svg>'
    );
  let open = $state(false);
</script>

<Button variant="outlined" onclick={() => (open = true)}>View photo</Button>
<Lightbox bind:open src={photo} alt="Gray circle on a dark background" />
