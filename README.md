<div align="center">

# @codeatlasdev/ui

### ship the whole screen, not the button.

svelte 5 · one theme object · your agent already knows it

[![npm](https://img.shields.io/npm/v/@codeatlasdev/ui?style=flat-square&label=npm&color=111)](https://www.npmjs.com/package/@codeatlasdev/ui)
[![svelte 5](https://img.shields.io/badge/svelte-5_runes-111?style=flat-square)](https://svelte.dev)
[![license](https://img.shields.io/npm/l/@codeatlasdev/ui?style=flat-square&color=111)](https://github.com/codeatlasdev/ui/blob/main/LICENSE)

**[live demo](https://ui.codeatlas.com.br)** · [docs](https://ui.codeatlas.com.br/docs/) · [theme editor](https://ui.codeatlas.com.br/theme/) · [changelog](https://ui.codeatlas.com.br/changelog/)

</div>

<br>

```sh
bunx @codeatlasdev/ui init --write
```

that's the setup. theme, dark mode, error pages, no white flash. sveltekit or astro.

claude code? skills + mcp + the numbered demo catalog in one line:

```
/plugin install codeatlas-ui --marketplace codeatlasdev/ui
```

<br>

## a whole page in 12 lines

```svelte
<AppList title="Users" data={users} searchKeys={['name', 'email']}>
  {#snippet children(list)}
    <SimpleTable responsive="cards">
      <thead><tr><th>User</th><th>Role</th></tr></thead>
      <tbody>
        {#each list.rows as u (u.id)}
          <tr><td><UserCell name={u.name} email={u.email} /></td><td>{u.role}</td></tr>
        {/each}
      </tbody>
    </SimpleTable>
  {/snippet}
</AppList>
```

search ✓ pagination ✓ empty state ✓ cards on mobile ✓ css you wrote: **0**

<br>

## your brand in one hex

```ts
export const theme = defineTheme({
  presets: [{ id: 'acme', color: '#2563eb' }],
  defaultPreset: 'acme',
});
```

every token derives from it, light and dark, on the first frame.
want a vibe? `designStyle('liquid')`, `'swiss'`, `'brutalism'`, `'sketchbook'`… same components, new language.

<br>

## why it hits different

|  |  |
|---|---|
| 🧱 **pages, not bricks** | `AppList` `AppForm` `AppSettings` `AppShellLayout` `AuthLayout` `DocsShell` |
| 🎨 **tokens all the way down** | no raw px in components, a lint fails the build if one sneaks in |
| 🪟 **glass is a material, not a component** | `<Surface material="glass">`, or `auto` to follow the theme |
| 🧭 **real layers** | native `<dialog>` + popover top layer, no z-index wars |
| ♿ **boring stuff, guaranteed** | aa/aaa contrast, 44px touch targets, no sideways scroll. tested |
| 🤖 **agent-native** | skills, `llms.txt` and an MCP server (`ca-ui-mcp`) generated from the code |

<br>

## what's inside

**layout** `Box` `Flex` `Stack` `Grid` `Container` `Section` `Surface` `Card`
**shells** `AppShellLayout` `PageShell` `MobilePane` `StickyActions` `DocsShell`
**inputs** `Button` `TextField` `Select` `Combobox` `DatePicker` `PinInput` `MoneyInput` …
**overlays** `Dialog` `AlertDialog` `Sheet` `Drawer` `Popover` `Tooltip` `CommandPalette`
**data** `DataTable` `SimpleTable` `KpiGrid` `LiveList` + 8 charts (`/charts`)
**seo** `Seo`, json-ld, sitemap, generated favicons + og images (`/seo`, `/vite`)

heavy stuff is opt-in: `/charts` needs `echarts`, `/table` needs `@tanstack/svelte-table`, `/code` needs `shiki`.

<br>

## hack on it

```sh
git clone https://github.com/codeatlasdev/ui && cd ui
bun install && bun dev     # lib watcher + docs site, one command
```

[contributing](https://github.com/codeatlasdev/ui/blob/main/CONTRIBUTING.md) · [code of conduct](https://github.com/codeatlasdev/ui/blob/main/CODE_OF_CONDUCT.md) · [security](https://github.com/codeatlasdev/ui/blob/main/SECURITY.md) · MIT

<br>

<div align="center">

thanks to our main supporters **Fábio Henrique Araújo** ([@FabioHAraujo](https://github.com/FabioHAraujo)) and **Richardson Douglas** ([@Richards0nd](https://github.com/Richards0nd)) 💛

<sub>made by <a href="https://codeatlas.com.br">codeatlas</a></sub>

</div>
