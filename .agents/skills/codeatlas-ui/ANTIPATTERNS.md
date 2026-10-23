# Anti-patterns

Explicit don'ts. Each one has a correct alternative.

---

## Layout

```svelte
<!-- ✗ Manual flex wrapper -->
<div style="display: flex; gap: 12px; align-items: center;">

<!-- ✓ -->
<Flex gap="3" align="center">
```

```svelte
<!-- ✗ Removed props: pixel gap, `cols`, CSS values for align/justify -->
<Stack gap={16}>
<Grid cols={3} gap={16}>
<Flex justify="space-between">

<!-- ✓ Gap is a spacing step, Grid takes `columns`, align/justify are keywords -->
<Stack gap="4">
<Grid columns={3} gap="4">
<Flex justify="between">

<!-- `Row`, `GlassCard` and `GlassSurface` are deprecated: use `Flex`, `Card` and `Surface`.
     bunx @codeatlasdev/ui migrate --write converts them. -->
```

```svelte
<!-- ✗ Arbitrary margin -->
<div style="margin-top: 24px;">
  <TextField .../>
</div>

<!-- ✓ Let FormSection or Stack handle spacing -->
<FormSection title="Details">
  <TextField .../>
</FormSection>
```

```svelte
<!-- ✗ Hardcoded color value -->
<div style="background: #1e293b; color: #f8fafc;">

<!-- ✓ Semantic token -->
<div style="background: var(--ca-glass-bg); color: var(--ca-text-primary);">
```

```css
/* ✗ Tint in OKLCH: gray tokens have hue 0°, so blue drifts to purple/pink */
background: color-mix(in oklch, var(--ca-brand-main) 15%, var(--ca-glass-tint));

/* ✓ Mix a color with a neutral (gray token, black, white, transparent) in OKLab */
background: color-mix(in oklab, var(--ca-brand-main) 15%, var(--ca-glass-tint));
```

---

## Card

```svelte
<!-- ✗ Manual padding override -->
<Card style="padding: 0;">

<!-- ✓ -->
<Card flush>

<!-- ✗ will-change + backdrop-filter: kills glass blur -->
<div style="will-change: transform; backdrop-filter: blur(12px);">

<!-- ✓ Never combine these two on the same element or its ancestors -->
```

---

## AppShell

```svelte
<!-- ✗ AppShellLayout in root layout -->
<!-- src/routes/+layout.svelte -->
<AppShellLayout ...>  <!-- applies to /login, /404, etc. -->

<!-- ✓ Only in authenticated section -->
<!-- src/routes/painel/+layout.svelte -->
<AppShellLayout ...>
```

---

## Imports

```ts
// ✗ Internal path import
import Button from '../../../packages/ui/src/lib/components/Button/Button.svelte';

// ✓
import { Button } from '@codeatlasdev/ui';
```

```svelte
<!-- ✗ Importing CSS in nested layouts -->
<!-- src/routes/painel/+layout.svelte -->
<script>
  import '@codeatlasdev/ui/styles/global.css'; // already imported in root
</script>

<!-- ✓ CSS imported once, in root layout only -->
```

---

## Components

```svelte
<!-- ✗ Stacking form fields manually inside FormSection -->
<FormSection title="Account">
  <Stack gap="4">
    <TextField label="Name" />
    <TextField label="Email" />
  </Stack>
</FormSection>

<!-- ✓ FormSection layout prop handles it -->
<FormSection title="Account">
  <TextField label="Name" />
  <TextField label="Email" />
</FormSection>
```

```svelte
<!-- ✗ Using Tailwind utility classes -->
<div class="flex items-center gap-3 mt-4 px-[17px]">

<!-- ✓ Layout primitives + token gap values -->
<Flex gap="3" align="center">
```

```svelte
<!-- ✗ Inline color for status -->
<span style="color: green;">Active</span>

<!-- ✓ -->
<StatusChip status="success" label="Active" />
```

---

## Svelte 5

```svelte
<!-- ✗ Legacy reactive declarations -->
$: fullName = `${first} ${last}`;

<!-- ✓ -->
const fullName = $derived(`${first} ${last}`);
```

```svelte
<!-- ✗ Legacy event directive -->
<button on:click={handler}>

<!-- ✓ -->
<button onclick={handler}>
```

```svelte
<!-- ✗ {@const} outside valid context -->
<div>
  {@const Icon = item.icon}  <!-- invalid: not inside #each/#if/snippet -->
  <Icon />
</div>

<!-- ✓ Inside #each -->
{#each items as item}
  {@const Icon = item.icon}
  <Icon size={16} />
{/each}
```
