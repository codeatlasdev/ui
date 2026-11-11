<script lang="ts" module>
  import type { TimelineItem } from '@codeatlasdev/ui';

  export interface ActivityEvent {
    id: string;
    actor: string;
    action: string;
    target?: string;
    time: string;
    category: 'user' | 'system' | 'billing';
    variant: TimelineItem['variant'];
  }
</script>

<script lang="ts">
  // Activity feed shared by the admin and app templates. Each passes its events and its sign-in rows;
  // the location cell is a snippet because the two templates style it with different classes.
  import type { Snippet } from 'svelte';
  import {
    PageShell, Card, Grid, Flex, Button, Avatar,
    Timeline, Select, StatusChip, SimpleTable,
  } from '@codeatlasdev/ui';
  import { RefreshCw } from '@lucide/svelte';

  interface Login {
    user: string;
    ip: string;
    location: string;
    time: string;
    ok: boolean;
  }
  interface Props {
    events: ActivityEvent[];
    logins: Login[];
    /** Location and IP of one sign-in. */
    loginLocation: Snippet<[Login]>;
  }
  let { events, logins, loginLocation }: Props = $props();

  let filter = $state('');
  const filterOpts = [
    { value: '',        label: 'All events' },
    { value: 'user',    label: 'Users'      },
    { value: 'system',  label: 'System'     },
    { value: 'billing', label: 'Billing'    },
  ];

  const filtered = $derived(
    filter === '' ? events : events.filter(e => e.category === filter)
  );

  const timelineItems = $derived<TimelineItem[]>(
    filtered.map(e => ({
      label: `${e.actor} ${e.action}${e.target ? ' ' + e.target : ''}`,
      date:  e.time,
      variant: e.variant,
    }))
  );

  const stats = [
    { label: 'Events today', value: '47' },
    { label: 'Active users', value: '12' },
    { label: 'Deployments',  value: '3'  },
    { label: 'Alerts fired', value: '2'  },
  ];
</script>

<PageShell title="Activity" description="Real-time event feed" maxWidth="1200px" gap={24}>
  {#snippet actions()}
    <Flex gap="2">
      <Select bind:value={filter} options={filterOpts} />
      <Button variant="ghost" size="sm">
        {#snippet leading()}<RefreshCw size={14} />{/snippet}
        Refresh
      </Button>
    </Flex>
  {/snippet}

  <Grid columns={{ base: 2, md: 4 }} gap="4">
    {#each stats as s}
      <Card>
        <p class="stat-label">{s.label}</p>
        <p class="stat-value">{s.value}</p>
      </Card>
    {/each}
  </Grid>

  <Grid class="grid-main-side" gap="5">
    <Card title="Event Timeline">
      <Timeline items={timelineItems} />
    </Card>

    <Card title="Recent Logins" flush>
      <SimpleTable>
        <thead>
          <tr><th>User</th><th>Location</th><th>Status</th></tr>
        </thead>
        <tbody>
          {#each logins as l}
            <tr>
              <td>
                <div class="login-user">
                  <Avatar alt={l.user} size="xs" />
                  <div>
                    <p class="login-name">{l.user}</p>
                    <p class="login-time">{l.time}</p>
                  </div>
                </div>
              </td>
              {@render loginLocation(l)}
              <td>
                <StatusChip
                  status={l.ok ? 'success' : 'error'}
                  label={l.ok ? 'OK' : 'Blocked'}
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </SimpleTable>
    </Card>
  </Grid>
</PageShell>

<style>
  :global(.grid-main-side) { grid-template-columns: 1fr 360px; }
  .stat-label { margin: 0 0 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ca-text-hint); }
  .stat-value { margin: 0; font-size: 28px; font-weight: 700; color: var(--ca-text-primary); line-height: 1; }

  .login-user { display: flex; align-items: center; gap: 8px; }
  .login-name { margin: 0; font-weight: 500; color: var(--ca-text-primary); font-size: 13px; }
  .login-time { margin: 0; font-size: 11px; color: var(--ca-text-hint); }
</style>
