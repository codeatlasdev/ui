---
name: codeatlas-dx
description: "Use when creating files, components, or feature modules: DX-first clean code, file size limits, no god files."
alwaysApply: false
---

# DX-first development

Write for the next developer (or AI). Files stay small, responsibilities stay clear, and shared logic lives in one place.

## File size rules

| File type | Max lines | Action at limit |
|---|---|---|
| Svelte component | 200 | Extract sub-components or composables |
| TypeScript module | 150 | Split by domain |
| Route `+page.svelte` | 300 | Move logic to `+page.ts` or a feature module |
| Store / composable | 80 | One state shape per file |

If you're scrolling to find something, the file is too long. Split it.

## Component structure

```
src/
  lib/
    components/
      UserCard/
        UserCard.svelte        # UI only, no data fetching
        UserCard.types.ts      # Props type, not shared globally
    features/
      users/
        users.store.svelte.ts  # $state store for this feature
        users.api.ts           # fetch calls
        users.utils.ts         # formatters, validators
    utils/
      format.ts                # formatCurrency, formatDate (pure fns)
      storage.ts               # localStorage helpers
```

## Rules

1. One component = one visual responsibility. If you're doing two things, split.
2. Logic used in 2+ places → extract to `utils/` or a composable. First use: inline.
3. Types live next to what they describe. No monolithic `types.ts`.
4. `$derived` for computed values. `$effect` only for side effects that can't be derived.
5. No `export let` in Svelte 5. Use `$props()`.
6. API calls belong in `*.api.ts`, not in components or stores.
7. Constants belong in `*.constants.ts` or top of the file that uses them. Not scattered.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase | `UserCard.svelte` |
| Composable / store | camelCase + `.svelte.ts` | `users.store.svelte.ts` |
| API module | camelCase + `.api.ts` | `users.api.ts` |
| Utils | camelCase + `.ts` | `format.ts` |
| Types | PascalCase | `UserCardProps` |
| Boolean props | `is` / `has` prefix | `isLoading`, `hasError` |

## Anti-patterns

```svelte
<!-- ✗ God component: fetches, formats, renders, handles errors, manages state -->
<script>
  // 400 lines of mixed concerns
</script>

<!-- ✓ Split: page fetches, component renders -->
<!-- +page.ts: load fn fetches data -->
<!-- +page.svelte: passes data to components -->
<!-- UserTable.svelte: renders the table only -->
```

```ts
// ✗ Barrel that exports 80 things from one index.ts
export * from './components/UserCard';
export * from './components/UserTable';
export * from './stores/users';
export * from './utils/format';
// ...40 more lines

// ✓ Import directly from the source file when building features
import { UserCard } from '$lib/components/UserCard/UserCard.svelte';
import { formatCurrency } from '$lib/utils/format';
// Only create barrels for published libraries, not internal feature modules
```

```ts
// ✗ Inline computation that belongs in a util
const formatted = `${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

// ✓
import { formatCurrency } from '$lib/utils/format';
const formatted = formatCurrency(value);
```

## Before creating a new file

Ask:
- Does this already exist in `@codeatlasdev/ui`? Use it.
- Does a util already do this? Import it.
- Is this logic used only once? Keep it inline.
- Will this be used in 3+ places? Extract it.
