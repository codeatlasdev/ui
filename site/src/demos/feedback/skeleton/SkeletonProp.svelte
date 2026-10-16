<script lang="ts">
  import { Avatar, Button, Card, Flex, KpiCard, Stack, TextField } from '@codeatlasdev/ui';

  let loading = $state(true);
</script>

<Stack gap="4">
  <Button variant="outlined" size="sm" onclick={() => (loading = !loading)}>
    {loading ? 'Show loaded' : 'Show loading'}
  </Button>
  <Flex gap="4" align="start" wrap>
    <Avatar alt="Ana Lima" size="xl" skeleton={loading} />
    <KpiCard title="Revenue" value="R$ 12.400" trend={3.2} skeleton={loading} />
  </Flex>
  <TextField label="Email" description="We never share it" skeleton={loading} />
  <Card title="Overview" skeleton={loading}>
    <p>The card keeps the exact size it has once loaded, so nothing shifts when the data arrives.</p>
  </Card>
</Stack>
