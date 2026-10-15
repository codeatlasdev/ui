<script lang="ts">
  import {
    PageShell, Card, Grid, Flex, Button, Chip, Avatar,
    Timeline, Select, StatusChip, SimpleTable,
  } from '@codeatlasdev/ui';
  import type { TimelineItem } from '@codeatlasdev/ui';
  import { RefreshCw, Filter } from '@lucide/svelte';

  let filter = $state('');
  const filterOpts = [
    { value: '',        label: 'All events'   },
    { value: 'user',   label: 'Users'        },
    { value: 'system', label: 'System'       },
    { value: 'billing',label: 'Billing'      },
  ];

  interface ActivityEvent {
    id: string;
    actor: string;
    avatar?: string;
    action: string;
    target?: string;
    time: string;
    category: 'user' | 'system' | 'billing';
    variant: TimelineItem['variant'];
  }

  const allEvents: ActivityEvent[] = [
    { id: 'e1',  actor: 'Hana Park',    action: 'joined',           target: 'Pro plan',              time: '2 min ago',    category: 'user',    variant: 'success' },
    { id: 'e2',  actor: 'System',       action: 'deployed',         target: 'v2.4.1 to production',  time: '18 min ago',   category: 'system',  variant: 'info'    },
    { id: 'e3',  actor: 'Ana Lima',     action: 'invited',          target: 'ivan@stack.io',         time: '34 min ago',   category: 'user',    variant: 'default' },
    { id: 'e4',  actor: 'Carlos Melo',  action: 'upgraded to',      target: 'Team plan',             time: '1 hr ago',     category: 'billing', variant: 'success' },
    { id: 'e5',  actor: 'System',       action: 'backup completed', target: 'database snapshot',     time: '2 hr ago',     category: 'system',  variant: 'success' },
    { id: 'e6',  actor: 'George Hart',  action: 'deleted',          target: '3 reports',             time: '3 hr ago',     category: 'user',    variant: 'warning' },
    { id: 'e7',  actor: 'System',       action: 'alert triggered',  target: 'disk usage >80%',       time: '4 hr ago',     category: 'system',  variant: 'warning' },
    { id: 'e8',  actor: 'Diana Kwan',   action: 'exported',         target: 'August report (CSV)',   time: '5 hr ago',     category: 'user',    variant: 'default' },
    { id: 'e9',  actor: 'System',       action: 'payment received', target: '$1,200 · Pro annual',   time: 'Yesterday',    category: 'billing', variant: 'success' },
    { id: 'e10', actor: 'Eduardo S.',   action: 'reset password',   target: undefined,               time: 'Yesterday',    category: 'user',    variant: 'default' },
    { id: 'e11', actor: 'System',       action: 'SSL renewed',      target: 'app.codeatlas.dev',     time: '2 days ago',   category: 'system',  variant: 'info'    },
    { id: 'e12', actor: 'Fiona Clarke', action: 'removed',          target: 'George Hart',           time: '2 days ago',   category: 'user',    variant: 'error'   },
    { id: 'e13', actor: 'System',       action: 'payment failed',   target: 'card ending 4242',      time: '3 days ago',   category: 'billing', variant: 'error'   },
    { id: 'e14', actor: 'Ana Lima',     action: 'changed role',     target: 'Carlos → Editor',       time: '4 days ago',   category: 'user',    variant: 'default' },
  ];

  const filtered = $derived(
    filter === '' ? allEvents : allEvents.filter(e => e.category === filter)
  );

  const timelineItems = $derived<TimelineItem[]>(
    filtered.map(e => ({
      label: `${e.actor} ${e.action}${e.target ? ' ' + e.target : ''}`,
      date: e.time,
      variant: e.variant,
    }))
  );

  // Stats
  const stats = [
    { label: 'Events today',  value: '47'  },
    { label: 'Active users',  value: '12'  },
    { label: 'Deployments',   value: '3'   },
    { label: 'Alerts fired',  value: '2'   },
  ];

  // Recent logins table
  const logins = [
    { user: 'Ana Lima',    ip: '192.168.1.1', location: 'São Paulo, BR', time: '09:42', status: 'success' },
    { user: 'Carlos Melo', ip: '10.0.0.42',   location: 'Rio, BR',       time: '09:11', status: 'success' },
    { user: 'Unknown',     ip: '45.33.32.156', location: 'Ashburn, US',   time: '08:55', status: 'error'   },
    { user: 'Diana Kwan',  ip: '203.0.113.5', location: 'Tokyo, JP',     time: '07:30', status: 'success' },
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

  <!-- Stats row -->
  <Grid columns={{ base: 2, md: 4 }} gap="4">
    {#each stats as s}
      <Card material="glass">
        <p class="stat-label">{s.label}</p>
        <p class="stat-value">{s.value}</p>
      </Card>
    {/each}
  </Grid>

  <Grid class="grid-main-side" gap="5">
    <!-- Timeline -->
    <Card material="glass" title="Event Timeline">
      <Timeline items={timelineItems} />
    </Card>

    <!-- Login audit -->
    <Card material="glass" title="Recent Logins" flush>
      <SimpleTable>
        <thead>
          <tr>
            <th>User</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
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
              <td class="login-loc">
                <p class="login-loc__city">{l.location}</p>
                <p class="login-loc__ip">{l.ip}</p>
              </td>
              <td>
                <StatusChip
                  status={l.status === 'success' ? 'success' : 'error'}
                  label={l.status === 'success' ? 'OK' : 'Blocked'}
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
  .stat-label {
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ca-text-hint);
  }

  .stat-value {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: var(--ca-text-primary);
    line-height: 1;
  }

  /* Login table */
  .login-user {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .login-name {
    margin: 0;
    font-weight: 500;
    color: var(--ca-text-primary);
    font-size: 13px;
  }

  .login-time {
    margin: 0;
    font-size: 11px;
    color: var(--ca-text-hint);
  }

  .login-loc__city {
    margin: 0;
    font-size: 12px;
    color: var(--ca-text-primary);
  }

  .login-loc__ip {
    margin: 0;
    font-size: 11px;
    color: var(--ca-text-hint);
    font-family: ui-monospace, monospace;
  }
</style>
