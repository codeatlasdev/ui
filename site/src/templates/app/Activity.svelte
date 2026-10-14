<script lang="ts">
  import {
    PageShell, GlassCard, Grid, Row, Button, Chip, Avatar,
    Timeline, Select, StatusChip, SimpleTable,
  } from '@codeatlasdev/ui';
  import type { TimelineItem } from '@codeatlasdev/ui';
  import { RefreshCw } from '@lucide/svelte';

  let filter = $state('');
  const filterOpts = [
    { value: '',        label: 'All events' },
    { value: 'user',    label: 'Users'      },
    { value: 'system',  label: 'System'     },
    { value: 'billing', label: 'Billing'    },
  ];

  interface ActivityEvent {
    id: string;
    actor: string;
    action: string;
    target?: string;
    time: string;
    category: 'user' | 'system' | 'billing';
    variant: TimelineItem['variant'];
  }

  const allEvents: ActivityEvent[] = [
    { id:'e1',  actor:'Hana Park',    action:'joined',           target:'Pro plan',             time:'2 min ago',   category:'user',    variant:'success' },
    { id:'e2',  actor:'System',       action:'deployed',         target:'v2.4.1 to production', time:'18 min ago',  category:'system',  variant:'info'    },
    { id:'e3',  actor:'Ana Lima',     action:'invited',          target:'ivan@stack.io',        time:'34 min ago',  category:'user',    variant:'default' },
    { id:'e4',  actor:'Carlos Melo',  action:'upgraded to',      target:'Team plan',            time:'1 hr ago',    category:'billing', variant:'success' },
    { id:'e5',  actor:'System',       action:'backup completed', target:'database snapshot',    time:'2 hr ago',    category:'system',  variant:'success' },
    { id:'e6',  actor:'George Hart',  action:'deleted',          target:'3 reports',            time:'3 hr ago',    category:'user',    variant:'warning' },
    { id:'e7',  actor:'System',       action:'alert triggered',  target:'disk usage >80%',      time:'4 hr ago',    category:'system',  variant:'warning' },
    { id:'e8',  actor:'Diana Kwan',   action:'exported',         target:'August report (CSV)',  time:'5 hr ago',    category:'user',    variant:'default' },
    { id:'e9',  actor:'System',       action:'payment received', target:'$1,200 · Pro annual',  time:'Yesterday',   category:'billing', variant:'success' },
    { id:'e10', actor:'Eduardo S.',   action:'reset password',   target:undefined,              time:'Yesterday',   category:'user',    variant:'default' },
    { id:'e11', actor:'System',       action:'SSL renewed',      target:'app.codeatlas.dev',    time:'2 days ago',  category:'system',  variant:'info'    },
    { id:'e12', actor:'Fiona Clarke', action:'removed',          target:'George Hart',          time:'2 days ago',  category:'user',    variant:'error'   },
  ];

  const filtered = $derived(
    filter === '' ? allEvents : allEvents.filter(e => e.category === filter)
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

  const logins = [
    { user:'Ana Lima',    ip:'192.168.1.1',  location:'São Paulo, BR', time:'09:42', ok:true  },
    { user:'Carlos Melo', ip:'10.0.0.42',    location:'Rio, BR',       time:'09:11', ok:true  },
    { user:'Unknown',     ip:'45.33.32.156', location:'Ashburn, US',   time:'08:55', ok:false },
    { user:'Diana Kwan',  ip:'203.0.113.5',  location:'Tokyo, JP',     time:'07:30', ok:true  },
  ];
</script>

<PageShell title="Activity" description="Real-time event feed" maxWidth="1200px" gap={24}>
  {#snippet actions()}
    <Row gap={8}>
      <Select bind:value={filter} options={filterOpts} />
      <Button variant="ghost" size="sm">
        {#snippet leading()}<RefreshCw size={14} />{/snippet}
        Refresh
      </Button>
    </Row>
  {/snippet}

  <Grid cols="repeat(4, 1fr)" gap={16}>
    {#each stats as s}
      <GlassCard>
        <p class="stat-label">{s.label}</p>
        <p class="stat-value">{s.value}</p>
      </GlassCard>
    {/each}
  </Grid>

  <Grid cols="1fr 360px" gap={20}>
    <GlassCard title="Event Timeline">
      <Timeline items={timelineItems} />
    </GlassCard>

    <GlassCard title="Recent Logins" flush>
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
              <td>
                <p class="loc-city">{l.location}</p>
                <p class="loc-ip">{l.ip}</p>
              </td>
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
    </GlassCard>
  </Grid>
</PageShell>

<style>
  .stat-label { margin:0 0 4px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--ca-text-hint); }
  .stat-value { margin:0; font-size:28px; font-weight:700; color:var(--ca-text-primary); line-height:1; }

  .login-user { display:flex; align-items:center; gap:8px; }
  .login-name { margin:0; font-weight:500; color:var(--ca-text-primary); font-size:13px; }
  .login-time { margin:0; font-size:11px; color:var(--ca-text-hint); }
  .loc-city   { margin:0; font-size:12px; color:var(--ca-text-primary); }
  .loc-ip     { margin:0; font-size:11px; color:var(--ca-text-hint); font-family:ui-monospace,monospace; }
</style>
