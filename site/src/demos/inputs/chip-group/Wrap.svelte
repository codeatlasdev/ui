<script lang="ts">
  import { ChipGroup } from '@codeatlasdev/ui';

  let size = $state('2-5');

  const sizes = [
    { value: '1', label: 'Just me' },
    { value: '2-5', label: '2 to 5' },
    { value: '6-20', label: '6 to 20' },
    { value: '21-50', label: '21 to 50' },
    { value: '50+', label: '50+' },
  ];
</script>

<ChipGroup label="Sales team size" items={sizes} bind:value={size} />
