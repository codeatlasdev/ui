<script lang="ts">
  import { Badge, IconButton, Flex } from '@codeatlasdev/ui';
  import { Bell } from '@lucide/svelte';
</script>

<Flex gap="4" align="center" wrap>
  <Badge count={5} color="brand"><IconButton aria-label="Notifications"><Bell size={20} /></IconButton></Badge>
  <Badge count={5} color="success"><IconButton aria-label="Notifications"><Bell size={20} /></IconButton></Badge>
  <Badge count={5} color="warning"><IconButton aria-label="Notifications"><Bell size={20} /></IconButton></Badge>
  <Badge count={5} color="error"><IconButton aria-label="Notifications"><Bell size={20} /></IconButton></Badge>
</Flex>
