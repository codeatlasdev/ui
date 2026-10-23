<script lang="ts">
  import AspectRatio from './AspectRatio.svelte';
  let { ratio, width, tall = false }: { ratio: number; width: number; tall?: boolean } = $props();
</script>

<div class="host" style="width:{width}px">
  <AspectRatio {ratio}>
    <img class="media" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" style={tall ? 'height:900px' : ''} />
  </AspectRatio>
</div>
