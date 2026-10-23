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

## ChipGroup (single choice among a few short options)

Use it for 3 to 8 short options (team size, frequency): `RadioGroup` is too tall, `SegmentedControl` never wraps and overflows a 390px screen. Never build chips from `Chip` + `onclick` for this.

```svelte
<ChipGroup
  label="Sales team size"
  name="teamSize"
  bind:value={size}
  items={[{ value: '1', label: 'Just me' }, { value: '2-5', label: '2 to 5' }]}
  error={errors.teamSize}
/>
```

A real `radiogroup` (roving tab stop, arrows/Home/End/Space/Enter), check icon on the selected chip, `error` as `role="alert"`, `name`/`required` for native forms.

---

## Card / Surface

`Card` is the container for titled content. `Surface` is the painted container underneath it (elevation, material, tone, variant, radius) for panels and custom blocks that are not a titled card. `GlassCard`, `GlassSurface` and `Row` are deprecated: use `Card`, `Surface` and `Flex` (`bunx @codeatlasdev/ui migrate --write`).

```svelte
<Card title="Revenue">
  <p>Content here</p>
</Card>

<!-- Several controls stacked with a gap, no Stack wrapper -->
<Card title="Topics" gap="md">
  <Checkbox label="Hacker News" />
  <Switch label="Daily digest" />
</Card>

<!-- Flush padding (for tables/charts that bleed to edges) -->
<Card title="Users" flush>
  <SimpleTable>…</SimpleTable>
</Card>

<!-- Surface: no header, no default padding; p takes a spacing step -->
<Surface elevation={2} tone="brand" p="4">…</Surface>
```

`Card` props: `title?: string`, `headingLevel?: 2-6` (renders `title` as a real heading; omit for a `<p>`), `padding?: 'none' | 'sm' | 'md' | 'lg' | <css length> | <number in px>`, `flush?: boolean` (no padding, wins over `padding`), `gap?: 'sm' | 'md' | 'lg' | <css length> | <number in px>` (stacks children in a column), `full?: boolean`, `skeleton?: boolean`, `href?: string` (renders a link card). Snippets: `children`, `headerActions`.

`Surface` props: `elevation` (0-5), `material` (`auto | solid | frosted | glass | liquid`), `tone` (`neutral | brand | success | warning | error | info`), `variant` (`filled | outlined | ghost`), `radius`, `interactive`, `glow`, `grain`, `as`, plus the `p`, `px`, `py` spacing steps.

Under a page `<h1>`, give card titles and `EmptyState` titles a valid level (`EmptyState` inside `PageShell` defaults to `<h2>`) so axe `heading-order` passes.

**Never** apply `padding:` directly to a Card. Use the `padding` prop or `flush`.

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

<!-- A detail view with its own header, close button and scroll: chromeless, full screen on phones.
     Never hide the header with CSS or override the body padding in the app. -->
<Drawer bind:open chromeless width="26rem" fullBleedBelow="sm" aria-labelledby="detail-title">
  <MyDetail />
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

## KpiGrid

A row of KpiCards. It reads its child count in CSS and only uses column counts that divide it, so a row never ends on an empty cell. Use it instead of `Grid` with an auto-fill template for KPIs: that recipe turns 3 cards at 390px into 2 + 1.

```svelte
<KpiGrid>
  <KpiCard title="Revenue" value="$112k" />
  <KpiCard title="Users" value="24.8k" />
  <KpiCard title="Orders" value="1.4k" />
</KpiGrid>
<!-- 3 cards: 3 across, or 1 column when narrow. 4 cards: 4, then 2x2, then 1. Tiles are 10rem minimum. -->
<!-- Above 12 children it falls back to auto-fill. Responds to its own width (container query). -->
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
| `ca-sr-only` | Visually hidden but still read by screen readers (table `<caption>`, AT-only text); add `ca-sr-only--focusable` to reveal on focus (skip links) |
| `ca-btn-danger` | Outlined button in error color |
| `ca-btn-danger-ghost` | Ghost button in error color |
| `ca-bar-fill` | Progress bar width (set `--bar-w` CSS var) |
| `ca-col-check` | Checkbox column (fixed width + compact) |
| `ca-col-actions` | Actions column (80px fixed) |
| `ca-row--selected` | Selected table row (brand tint) |
