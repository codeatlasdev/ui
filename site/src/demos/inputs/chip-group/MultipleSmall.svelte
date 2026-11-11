<script lang="ts">
  import { ChipGroup } from '@codeatlasdev/ui';

  let picked = $state<string[]>(['dentists', 'lawyers']);

  const niches = [
    { value: 'dentists', label: 'Dentists' },
    { value: 'lawyers', label: 'Lawyers' },
    { value: 'doctors', label: 'Doctors' },
    { value: 'architects', label: 'Architects' },
    { value: 'accountants', label: 'Accountants' },
    { value: 'vets', label: 'Veterinarians' },
    { value: 'gyms', label: 'Gyms', disabled: true },
  ];
</script>

<ChipGroup multiple size="sm" label="Most searched" items={niches} bind:value={picked} />
