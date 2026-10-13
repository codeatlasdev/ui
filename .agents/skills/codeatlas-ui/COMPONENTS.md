# Component reference

## Button

```ts
type Variant = 'filled' | 'glass' | 'outlined' | 'ghost' | 'destructive';
type Size    = 'sm' | 'md' | 'lg';
```

| Prop | Type | Default |
|---|---|---|
| `variant` | `Variant` | `'filled'` |
| `size` | `Size` | `'md'` |
| `href` | `string` | — renders `<a>` |
| `disabled` | `boolean` | `false` |
| `fullWidth` | `boolean` | `false` |
| `type` | `'button'\|'submit'\|'reset'` | `'button'` |

Snippets: `children` (label), `leading` (icon before), `trailing` (icon after).

```svelte
<!-- Primary action -->
<Button variant="filled" onclick={save}>Save changes</Button>

<!-- Icon + label -->
<Button variant="outlined" size="sm">
  {#snippet leading()}<Plus size={14} />{/snippet}
  Add item
</Button>

<!-- Link button -->
<Button variant="ghost" href="/users">Back</Button>

<!-- Danger -->
<Button variant="destructive" onclick={confirmDelete}>Delete</Button>
```

---

## TextField / TextArea / NumberField

```svelte
<TextField label="Email" type="email" bind:value={email} placeholder="you@example.com" />
<TextField label="Search" bind:value={q} class="ca-search-field">
  {#snippet leading()}<Search size={14} />{/snippet}
</TextField>

<TextArea label="Description" bind:value={desc} rows={4} />

<NumberField label="Quantity" bind:value={qty} min={1} max={999} />
```

Key props shared by all: `label`, `placeholder`, `disabled`, `error` (string), `hint` (string), `required`.

---

## Select / Combobox

```ts
type Option = { label: string; value: string | number; disabled?: boolean };
```

```svelte
<Select label="Role" bind:value={role} options={roleOpts} />

<!-- Searchable select -->
<Combobox label="Country" bind:value={country} options={countryOpts} placeholder="Search…" />
```

---

## Checkbox / Switch / RadioGroup / Slider

```svelte
<Checkbox label="Remember me" bind:checked={remember} />

<Switch label="Email notifications" bind:checked={emailNotifs} />

<RadioGroup
  label="Plan"
  bind:value={plan}
  options={[
    { label: 'Free', value: 'free' },
    { label: 'Pro', value: 'pro' },
  ]}
/>

<!-- Single value -->
<Slider label="Volume" bind:value={volume} min={0} max={100} />
<!-- Range -->
<Slider label="Price range" bind:values={priceRange} min={0} max={1000} />
```

---

## GlassCard

```svelte
<GlassCard title="Revenue">
  <p>Content here</p>
</GlassCard>

<!-- No title -->
<GlassCard>
  <LineChart ... />
</GlassCard>

<!-- Flush padding (for tables/charts that bleed to edges) -->
<GlassCard title="Users" flush>
  <SimpleTable>…</SimpleTable>
</GlassCard>
```

Props: `title?: string`, `flush?: boolean` (removes card padding).

**Never** apply `padding:` directly to a GlassCard. Use the `padding` prop.

---

## Avatar / Badge / Chip / StatusChip

```svelte
<Avatar src={user.avatar} alt={user.name} size="md" />
<!-- sizes: xs | sm | md | lg | xl -->

<Badge count={5} />
<Badge count={99} max={99} />  <!-- shows "99+" -->

<Chip label="Svelte" />
<Chip label="Active" color="success" />

<StatusChip status="success" />   <!-- success | warning | error | neutral | info -->
<StatusChip status="warning" label="Pending review" />
```

---

## Alert

```svelte
<Alert severity="info" title="Heads up">
  Your trial ends in 3 days.
</Alert>
<!-- severity: info | success | warning | error -->
```

---

## AuthLayout / AuthCard

```svelte
<AuthLayout logoName="Acme">
  {#snippet brand()}<AcmeLogo size={32} />{/snippet}  <!-- or logoMark="AC" -->
  {#snippet panel()}<blockquote>…</blockquote>{/snippet}
  <AuthCard title="Sign in" subtitle="Access your account">
    <TextField label="Email" type="email" bind:value={email} />
    {#snippet footer()}No account? <a href="/register">Create one</a>{/snippet}
  </AuthCard>
</AuthLayout>
```

---

## Dialog / Drawer

```svelte
<script>
  let open = $state(false);
</script>

<Button onclick={() => open = true}>Open dialog</Button>

<Dialog bind:open title="Confirm deletion">
  <p>This action cannot be undone.</p>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => open = false}>Cancel</Button>
    <Button variant="destructive" onclick={confirmDelete}>Delete</Button>
  {/snippet}
</Dialog>

<Drawer bind:open title="Edit user" side="right">
  <AppForm title="Edit user" backHref="">
    …
  </AppForm>
</Drawer>
```

---

## Toast

```svelte
<script>
  import { Toaster, toast } from '@codeatlasdev/ui';

  function save() {
    // on success:
    toast.success('Saved.');
    // on error:
    toast.error('Failed to save. Try again.');
  }
</script>

<!-- In root layout: -->
<Toaster />
```

---

## Tooltip / Popover / DropdownMenu

```svelte
<Tooltip content="Edit this item">
  <IconButton onclick={edit}><Edit2 size={14} /></IconButton>
</Tooltip>

<DropdownMenu>
  {#snippet trigger()}
    <Button variant="ghost" size="sm"><MoreHorizontal size={14} /></Button>
  {/snippet}
  <DropdownMenuItem onclick={edit}>Edit</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onclick={remove} class="ca-btn-danger-ghost">Delete</DropdownMenuItem>
</DropdownMenu>
```

---

## Charts

All charts are data-only: pass data, get a chart. No ECharts options, no color config.

```svelte
import { LineChart, BarChart, PieChart, ScatterChart, HeatmapChart, GaugeChart, RadarChart, Sparkline } from '@codeatlasdev/ui/charts';

<LineChart
  series={[{ name: 'Revenue', data: [120, 145, 132, 167, 190] }]}
  categories={['Jan', 'Feb', 'Mar', 'Apr', 'May']}
  height="260px"
  area
/>

<BarChart
  series={[{ name: 'Sales', data: [88, 102, 95, 110] }]}
  categories={['Q1', 'Q2', 'Q3', 'Q4']}
/>

<PieChart
  series={[
    { name: 'Direct', value: 40 },
    { name: 'Organic', value: 35 },
    { name: 'Referral', value: 25 },
  ]}
/>

<Sparkline data={[12, 18, 14, 22, 19, 28]} />
```

---

## KpiCard

```svelte
<KpiCard
  title="Monthly revenue"
  value="$112,400"
  trend={18.4}
  icon={DollarSign}
/>
<!-- trend: positive = green up, negative = red down -->
```

---

## Utility CSS classes

Use these instead of writing equivalent CSS:

| Class | Purpose |
|---|---|
| `ca-search-field` | Search input in toolbar (flex:1, min 180px, max 320px) |
| `ca-toolbar-spacer` | Push remaining items right |
| `ca-row-actions` | Row action buttons (hidden until row hover) |
| `ca-page-info` | Pagination label text |
| `ca-btn-danger` | Outlined button in error color |
| `ca-btn-danger-ghost` | Ghost button in error color |
| `ca-bar-fill` | Progress bar width (set `--bar-w` CSS var) |
| `ca-col-check` | Checkbox column (fixed width + compact) |
| `ca-col-actions` | Actions column (80px fixed) |
| `ca-row--selected` | Selected table row (brand tint) |
