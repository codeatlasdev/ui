<!--
  Type test (checked by `bun run check`, not rendered, #474): `T` is inferred from `data`, so the
  `list` of every snippet is a `UseListStateReturn<User>` and a row is a `User`, not `any`. Each
  `@ts-expect-error` must fire, otherwise svelte-check reports it as unused.
-->
<script lang="ts">
  import type { UseListStateReturn } from '../../utils/use-list-state.svelte.js';
  import AppList from './AppList.svelte';

  interface User {
    id: number;
    name: string;
    status: 'active' | 'inactive';
  }
  const users: User[] = [{ id: 1, name: 'Ana', status: 'active' }];

  const nameOf = (list: UseListStateReturn<User>) => list.rows.map((u) => u.name);
  const emailOf = (list: UseListStateReturn<User>) =>
    // @ts-expect-error `User` has no `email`
    list.rows.map((u) => u.email);
  void emailOf;
</script>

<AppList data={users} searchKeys={['name']} idKey="id">
  {#snippet filters(list: UseListStateReturn<User>)}
    {nameOf(list).length}
  {/snippet}

  {#snippet children(list: UseListStateReturn<User>)}
    {#each list.rows as user (user.id)}
      {user.name}
    {/each}
  {/snippet}
</AppList>

<AppList
  data={users}
  searchKeys={[
    // @ts-expect-error `nope` is not a key of `User`
    'nope',
  ]}
/>
