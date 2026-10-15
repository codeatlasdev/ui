<script lang="ts">
  import { Badge, IconButton, Flex } from '@codeatlasdev/ui';
  import { Bell, Mail, ShoppingCart } from '@lucide/svelte';
</script>

<Flex gap="4" align="center" wrap>
  <Badge dot><IconButton aria-label="Notifications"><Bell size={20} /></IconButton></Badge>
  <Badge count={3}><IconButton aria-label="Messages"><Mail size={20} /></IconButton></Badge>
  <Badge count={99}><IconButton aria-label="Cart"><ShoppingCart size={20} /></IconButton></Badge>
  <Badge count={100}><IconButton aria-label="Notifications"><Bell size={20} /></IconButton></Badge>
</Flex>
