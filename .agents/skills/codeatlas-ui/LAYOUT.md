# Layout primitives

Three building blocks cover all layout: `Flex`, `Stack`, `Grid`. `Box`, `Container` and `Section` add padding, a width cap and page bands. Never write `display: flex` or `display: grid` CSS directly.

```svelte
<script>
  import { Box, Flex, Stack, Grid, Container, Section } from '@codeatlasdev/ui';
</script>
```

`Row` is deprecated (use `Flex`). Run `bunx @codeatlasdev/ui migrate --write src` to convert old `Row`, `Stack gap={16}` and `Grid cols=` usages.

## Token props, not raw CSS

Spacing and alignment are token props. A prop never becomes inline CSS: it renders as a `data-*` attribute (`data-gap="4"`) styled by one stylesheet, so pass a **step of the spacing scale**, not pixels and not a CSS value.

- `gap`, `p`, `px`, `py` take a step: `gap="4"` is `--ca-space-4`. Numbers and strings both work (`gap={4}` is the same step as `gap="4"`), and neither is pixels.
- The scale is `0 0.5 1 1.5 2 2.5 3 3.5 4 4.5 5 6 7 8 10 11 12 16 20 24`. One step is 4px at the default density, so `gap="4"` is 16px.
- A value off the scale logs a `[ca-ui]` warning in development and renders unstyled. For a one-off value add a class.
- `align` is `start | center | end | stretch | baseline`. `justify` is `start | center | end | between | around | evenly`. Not `flex-start` or `space-between`.
- Every token prop also takes a responsive object: `gap={{ base: '2', md: '4' }}`. `base` applies everywhere, each breakpoint from its width up (`sm` 600, `md` 900, `lg` 1200, `xl` 1536 px).
- Every primitive takes `as` (`as="ul"`, `as="form"`) and forwards `class` and other attributes.

| Primitive | Renders | Props |
|---|---|---|
| `Box` | `div`, padding | `p`, `px`, `py` |
| `Flex` | `display: flex` | `gap`, `p`, `px`, `py`, `align`, `justify`, `direction`, `wrap` |
| `Stack` | a Flex column | `gap`, `p`, `px`, `py`, `align`, `justify` |
| `Grid` | `display: grid`, equal tracks | `columns`, `gap`, `p`, `px`, `py`, `align` |
| `Container` | centered, width-capped, fluid gutter | `size` (`sm` `md` `lg` `xl`), `px`, `py` |
| `Section` | a `<section>` with the page rhythm | `size` (`1` `2` `3`), `px`, `py` |

### Pixels to steps

| Pixels | Step |
|---|---|
| 4px | `"1"` |
| 8px | `"2"` |
| 12px | `"3"` |
| 16px | `"4"` |
| 20px | `"5"` |
| 24px | `"6"` |
| 32px | `"8"` |
| 40px | `"10"` |
| 48px | `"12"` |

### Pixels or steps: who takes what

| Component | `gap` is |
|---|---|
| `Flex`, `Stack`, `Grid` | a spacing step (`gap="4"`) |
| `PageShell` | a number of pixels (`gap={24}`) |
| `KpiGrid` | a number of pixels or a CSS length string |

Check the prop type with `get_component` before passing a number.

---

## Grid

CSS grid with equal tracks. `display: grid; width: 100%`.

| Prop | Type | Notes |
|---|---|---|
| `columns` | `1`-`12` or responsive object | Equal tracks: `columns={3}` is `repeat(3, 1fr)`. |
| `gap` | spacing step | `gap="4"` |
| `p`, `px`, `py` | spacing step | Padding. |
| `align` | `start \| center \| end \| stretch \| baseline` | `align-items` |

There is no `cols` prop. For an arbitrary template (`2fr 1fr`, `repeat(auto-fill, minmax(240px, 1fr))`) write `grid-template-columns` in a class and pass it as `class`.

```svelte
<script>
  import { Grid, Card } from '@codeatlasdev/ui';
  import { LineChart } from '@codeatlasdev/ui/charts';
</script>

<!-- Equal columns -->
<Grid columns={3} gap="4">
  <Card title="Plan">…</Card>
  <Card title="Usage">…</Card>
  <Card title="Billing">…</Card>
</Grid>

<!-- Responsive: 1 column on phones, 3 from md up -->
<Grid columns={{ base: 1, md: 3 }} gap={{ base: '2', md: '4' }}>
  {#each cards as card (card.id)}
    <Card title={card.title}>{card.content}</Card>
  {/each}
</Grid>

<!-- Custom column widths: the template lives in a class -->
<Grid gap="6" class="revenue-grid">
  <LineChart {series} {categories} />
  <Card title="Summary">…</Card>
</Grid>

<style>
  .revenue-grid { grid-template-columns: 2fr 1fr; }
</style>
```

KPI row: use `KpiGrid`, never `Grid` auto-fill. It counts the children, so 3 cards are 3 across or 1 column (never 2 + 1 with an empty cell) and 4 are 4, 2x2, then 1.

```svelte
<KpiGrid>
  <KpiCard title="Revenue" value="$112k" />
  <KpiCard title="Users" value="24.8k" />
  <KpiCard title="Orders" value="1.4k" />
</KpiGrid>
```

---

## Flex

Flex container (`display: flex`, `direction` defaults to `row`).

| Prop | Type | Notes |
|---|---|---|
| `gap` | spacing step | |
| `align` | `start \| center \| end \| stretch \| baseline` | `align-items` |
| `justify` | `start \| center \| end \| between \| around \| evenly` | `justify-content` |
| `direction` | `row \| column \| row-reverse \| column-reverse` (or responsive) | `{ base: 'column', md: 'row' }` |
| `wrap` | `boolean` | Adds `flex-wrap: wrap` |
| `p`, `px`, `py` | spacing step | Padding. |

```svelte
<script>
  import { Flex, TextField, Select, Button } from '@codeatlasdev/ui';

  let search = $state('');
  let status = $state('');
  const statusOpts = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'active' },
  ];
</script>

<!-- Toolbar pattern -->
<Flex gap="2" align="center" justify="between">
  <TextField placeholder="Search…" bind:value={search} />
  <Flex gap="2" align="center">
    <Select bind:value={status} options={statusOpts} />
    <Button href="/new">+ New</Button>
  </Flex>
</Flex>

<!-- Action row -->
<Flex gap="2" align="center" justify="end">
  <Button variant="ghost" href="/back">Cancel</Button>
  <Button variant="filled" onclick={save}>Save</Button>
</Flex>
```

---

## Stack

Vertical flex (a Flex column).

| Prop | Type | Notes |
|---|---|---|
| `gap` | spacing step | |
| `align` | `start \| center \| end \| stretch \| baseline` | `align-items` |
| `justify` | `start \| center \| end \| between \| around \| evenly` | `justify-content` |
| `p`, `px`, `py` | spacing step | Padding. |

```svelte
<script>
  import { Stack, TextField, Button, FormSection, Switch } from '@codeatlasdev/ui';

  let email = $state('');
  let password = $state('');
  let name = $state('');
  let bio = $state('');
  let emailDigest = $state(true);
  let pushNotifs = $state(false);
</script>

<!-- Form field group -->
<Stack gap="3">
  <TextField label="Email" bind:value={email} />
  <TextField label="Password" type="password" bind:value={password} />
  <Button variant="filled" fullWidth type="submit">Sign in</Button>
</Stack>

<!-- Settings sections -->
<Stack gap="5">
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

## Box, Container, Section

- `Box`: a `div` (or `as`) that only adds padding: `<Box p="4">`, `<Box px={{ base: '3', md: '6' }}>`.
- `Container`: centered, width-capped column with the fluid page gutter. `size` is `sm` (40rem), `md` (56rem), `lg` (default, the content width) or `xl` (90rem).
- `Section`: a `<section>` with the vertical page rhythm. `size` is `1` compact, `2` default, `3` airy; a `py` token overrides it. Give it `aria-labelledby` when it is a landmark worth navigating to.

```svelte
<Container size="md">
  <Section>
    <Stack as="ul" gap="4">…</Stack>
    <Grid columns={{ base: 1, md: 3 }} gap="4">…</Grid>
  </Section>
</Container>
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

  <Grid gap="5" class="dashboard-split">
    <Card title="Revenue over time">
      <LineChart {series} {categories} height="260px" />
    </Card>
    <Stack gap="3">
      <Card title="Top channels">…</Card>
      <Card title="Recent activity">…</Card>
    </Stack>
  </Grid>
</PageShell>

<style>
  .dashboard-split { grid-template-columns: 2fr 1fr; }
</style>
```

---

## Spacing tokens

Use `--ca-space-N` for one-off gaps in your own CSS instead of arbitrary px values. These are the same steps the `gap`, `p`, `px` and `py` props take.

| Token | Value (default density) |
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

Pass token steps to layout primitives, not raw CSS: `<Flex gap="4">` is correct. `<Flex gap="16px">` and `<Flex gap="var(--ca-space-4)">` are not on the scale and render unstyled. `<Flex gap={16}>` is worse: 16 is a valid step, so it silently means 64px.

---

## Anti-patterns

```svelte
<!-- ✗ Never: manual flex container -->
<div style="display: flex; gap: 12px; align-items: center;">
  <Button>Cancel</Button>
  <Button variant="filled">Save</Button>
</div>

<!-- ✓ Correct -->
<Flex gap="3" align="center">
  <Button>Cancel</Button>
  <Button variant="filled">Save</Button>
</Flex>

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
