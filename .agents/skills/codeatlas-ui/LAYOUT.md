# Layout primitives

Three building blocks cover all layout: `Grid`, `Row`, `Stack`. Never write `display: flex` or `display: grid` CSS directly.

---

## Grid

CSS grid. `display: grid; width: 100%`.

```svelte
import { Grid } from '@codeatlasdev/ui';
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `cols` | `number \| string` | — | Number → `repeat(N, 1fr)`. String → raw CSS template columns. |
| `gap` | `number \| string` | `0` | Number → px. String → raw CSS. |
| `rowGap` | `number \| string` | — | Overrides row gap only. |
| `colGap` | `number \| string` | — | Overrides column gap only. |
| `align` | `string` | `stretch` | `align-items` |
| `justify` | `string` | `stretch` | `justify-items` |
| `class` | `string` | — | Extra CSS classes. |

```svelte
<!-- Equal columns -->
<Grid cols={3} gap={16}>
  <GlassCard title="Plan">…</GlassCard>
  <GlassCard title="Usage">…</GlassCard>
  <GlassCard title="Billing">…</GlassCard>
</Grid>

<!-- Custom column widths -->
<Grid cols="2fr 1fr" gap={24}>
  <LineChart {series} {categories} />
  <GlassCard title="Summary">…</GlassCard>
</Grid>

<!-- Responsive auto-fill (many similar cards; a partial last row is fine here) -->
<Grid cols="repeat(auto-fill, minmax(240px, 1fr))" gap={20}>
  {#each cards as card}
    <GlassCard title={card.title}>{card.content}</GlassCard>
  {/each}
</Grid>

<!-- KPI row: use KpiGrid, never Grid auto-fill. It counts the children, so 3 cards are
     3 across or 1 column (never 2 + 1 with an empty cell) and 4 are 4, 2x2, then 1. -->
<KpiGrid>
  <KpiCard title="Revenue" value="$112k" />
  <KpiCard title="Users" value="24.8k" />
  <KpiCard title="Orders" value="1.4k" />
</KpiGrid>
```

---

## Row

Horizontal flex. `display: flex; flex-direction: row`.

```svelte
import { Row } from '@codeatlasdev/ui';
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `gap` | `number \| string` | `0` | |
| `align` | `string` | `flex-start` | `align-items` |
| `justify` | `string` | `flex-start` | `justify-content` |
| `wrap` | `boolean` | `false` | Adds `flex-wrap: wrap` |
| `class` | `string` | — | |

```svelte
<!-- Toolbar pattern -->
<Row gap={8} align="center" justify="space-between">
  <TextField placeholder="Search…" bind:value={search} />
  <Row gap={8} align="center">
    <Select bind:value={status} options={statusOpts} />
    <Button href="/new">+ New</Button>
  </Row>
</Row>

<!-- Action row -->
<Row gap={8} align="center" justify="flex-end">
  <Button variant="ghost" href="/back">Cancel</Button>
  <Button variant="filled" onclick={save}>Save</Button>
</Row>
```

---

## Stack

Vertical flex. `display: flex; flex-direction: column`.

```svelte
import { Stack } from '@codeatlasdev/ui';
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `gap` | `number \| string` | `0` | |
| `align` | `string` | `stretch` | `align-items` |
| `justify` | `string` | `flex-start` | `justify-content` |
| `class` | `string` | — | |

```svelte
<!-- Form field group -->
<Stack gap={12}>
  <TextField label="Email" bind:value={email} />
  <TextField label="Password" type="password" bind:value={password} />
  <Button variant="filled" fullWidth type="submit">Sign in</Button>
</Stack>

<!-- Settings section -->
<Stack gap={20}>
  <FormSection title="Profile">
    <TextField label="Name" bind:value={name} />
    <TextField label="Bio" bind:value={bio} />
  </FormSection>
  <FormSection title="Notifications" layout="list">
    <Switch label="Email digest" bind:checked={emailDigest} />
    <Switch label="Push notifications" bind:checked={pushNotifs} />
  </FormSection>
</Stack>
```

---

## Composition patterns

```svelte
<!-- Dashboard layout: KPIs + chart + side panel -->
<PageShell title="Dashboard">
  <KpiGrid>
    <KpiCard title="Revenue" value="$112k" trend={18.4} />
    <KpiCard title="Users" value="24.8k" trend={12.1} />
    <KpiCard title="Conversion" value="3.2%" trend={-1.8} />
  </KpiGrid>

  <Grid cols="2fr 1fr" gap={20}>
    <GlassCard title="Revenue over time">
      <LineChart {series} {categories} height="260px" />
    </GlassCard>
    <Stack gap={12}>
      <GlassCard title="Top channels">…</GlassCard>
      <GlassCard title="Recent activity">…</GlassCard>
    </Stack>
  </Grid>
</PageShell>
```

---

## Spacing tokens

Use `--ca-space-N` for one-off gaps instead of arbitrary px values.

| Token | Value |
|---|---|
| `--ca-space-1` | 4px |
| `--ca-space-2` | 8px |
| `--ca-space-3` | 12px |
| `--ca-space-4` | 16px |
| `--ca-space-5` | 20px |
| `--ca-space-6` | 24px |
| `--ca-space-8` | 32px |
| `--ca-space-10` | 40px |
| `--ca-space-12` | 48px |

Pass numbers to layout primitives instead of token strings: `<Row gap={16}>` is correct. `<Row gap="--ca-space-4">` is not.

---

## Anti-patterns

```svelte
<!-- ✗ Never: manual flex container -->
<div style="display: flex; gap: 12px; align-items: center;">
  <Button>Cancel</Button>
  <Button variant="filled">Save</Button>
</div>

<!-- ✓ Correct -->
<Row gap={12} align="center">
  <Button>Cancel</Button>
  <Button variant="filled">Save</Button>
</Row>

<!-- ✗ Never: arbitrary margin to push elements -->
<div style="margin-top: 24px; margin-bottom: 8px;">
  <TextField label="Name" />
</div>

<!-- ✓ Correct: let Stack or FormSection handle spacing -->
<FormSection title="Details">
  <TextField label="Name" bind:value={name} />
</FormSection>

<!-- ✗ Never: hardcoded color -->
<div style="background: #1a1a2e; color: #e2e8f0;">…</div>

<!-- ✓ Correct -->
<div style="background: var(--ca-glass-bg); color: var(--ca-text-primary);">…</div>
```
