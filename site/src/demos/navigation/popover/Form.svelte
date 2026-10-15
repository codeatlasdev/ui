<script lang="ts">
  import { Popover, Button, TextField, Stack, Flex } from '@codeatlasdev/ui';
</script>

<Popover side="bottom" align="start">
  {#snippet triggerChild(props)}<Button variant="filled" {...props}>Edit label</Button>{/snippet}
  <Stack gap="3">
    <TextField label="Label name" placeholder="e.g. Priority" />
    <Flex gap="2" justify="end">
      <Button size="sm" variant="ghost">Cancel</Button>
      <Button size="sm" variant="filled">Save</Button>
    </Flex>
  </Stack>
</Popover>
