# AGENTES.md — Guia para Agentes de IA

Este documento descreve tudo que um agente de IA precisa saber para trabalhar com este repositório.

---

## O que é este projeto

`@codeatlasdev/ui` é o pacote de UI da CodeAtlas. É uma biblioteca Svelte 5 publicada publicamente no npm. Todo frontend da empresa importa componentes, tokens e estilos a partir daqui.

---

## Estrutura do monorepo

```
packages/ui/          → biblioteca publicável (@codeatlasdev/ui)
  bin/                → CLIs: codeatlas-ui (init, migrate) e ca-ui-mcp (servidor MCP)
  scripts/            → build-manifest.ts (components/tokens/guides.json), build-bin.ts, build-themes.ts
  src/cli/            → lógica do init e do migrate (testada em tests/cli.test.ts)
  src/lib/
    components/       → componentes Svelte 5
    styles/           → CSS: global.css (tudo), core.css (sem presets extras), presets/*.css, base.css, tokens.css, materials.css
    tokens/           → constantes TypeScript (cores, tipografia, sombras, etc.)
    stores/           → svelte $state reativos (colorScheme, responsive, reducedMotion)
    utils/            → debounce, clipboard, localStorage, palette-generator
    index.ts          → barrel export principal
site/                 → site Astro (landing + docs MDX + templates) em ui.codeatlas.com.br
```

---

## Testes

Sempre `bun run test` (nunca `bun test`, que roda o runner do Bun e ignora Vitest/Playwright).

| Comando | O que roda |
|---|---|
| `bun run test` | unit + browser + E2E |
| `bun run test:unit` | Vitest projeto `unit` (Node) |
| `bun run test:browser` | Vitest projeto `browser` (Chromium real, axe) |
| `bun run test:e2e` / `test:a11y` | Playwright no site estático (build + preview) |
| `bun run test:vrt` / `test:vrt:update` | regressão visual via Docker (baselines só Linux) |

Convenções de nome:
- `*.test.ts` — Node (TS puro), em `packages/ui/src` ou `packages/ui/tests/`.
- `*.svelte.test.ts` — componente em browser, ao lado do componente.
- `*.vrt.test.ts` — screenshot por componente; harness de matriz `NomeMatrix.test.svelte`.
- `*.test.svelte` — harness para snippets/`bind:` (não vai para `dist`).
- `site/tests/*.spec.ts` (desktop+mobile+iphone), `*.a11y.spec.ts`, `*.visual.spec.ts`.
- Títulos de teste curtos: `describe` + `it` somados em até ~80 caracteres. O Vitest nomeia o anexo de trace com caminho + título + hash, e nomes acima de 255 bytes falham com `ENAMETOOLONG`, perdendo o trace justamente quando o teste falha.

Regra: todo componente novo exige `.svelte.test.ts` com `expect(await checkA11y(screen.container)).toHaveNoViolations()` em cada estado (aberto/fechado). `render` de `vitest-browser-svelte` é async. Avisos `a11y_*` são erro: `bun run check` usa `--fail-on-warnings` e o build do site falha via `onwarn` (`site/svelte.config.js`) (o `svelte-package` não compila `.svelte`, então no pacote quem barra é o `check`).

Regras de acessibilidade (pacote e apps):
- Uma página tem exatamente um `<main>` e um `id="main"`. `DocsShell` e `AuthLayout` já os trazem; `AppShellLayout` usa um `div.ca-shell__content` como alvo do `SkipLink` (passe `mainId={null}` se a página renderiza o próprio `<main id="main" tabindex="-1">`, e `skipLink={false}` ao embutir o shell numa página que já tem skip link). `PageShell` nunca emite `<main>`.
- Anúncios para leitor de tela passam por `announce(msg, politeness)` (uma live region compartilhada); não crie `role="status"` local novo. No SvelteKit monte `RouteAnnouncer` (`@codeatlasdev/ui/kit`) uma vez no layout raiz.
- `aria-label` num botão precisa conter o texto visível (WCAG 2.5.3); componha com `aria-labelledby` como o `Combobox` faz com `ariaLabel`.
- CSS novo de superfície com glass/sombra/`border: none` precisa de entrada no bloco `@media (forced-colors: active)` de `materials.css` (borda `CanvasText`). Tokens de contraste (`prefers-contrast: more`) vêm de `themeCSS`/`presetCSS`; `tests/contrast.test.ts` mede 7:1 para texto e 3:1 para contornos em todo preset.
- `site/tests/routes.a11y.spec.ts` roda axe em dark, light e `forcedColors: "active"` em cada rota, e garante no máximo um `#main`, um `<main>` e um skip link por página.

Lendo falhas: locators falham com ARIA snapshot; traces em `__traces__/` (Vitest) e `site/test-results/<id>/trace.zip` (`bunx playwright trace open <zip>`); diffs visuais em `packages/ui/.vitest/attachments` e `site/playwright-report`. Para saída enxuta: `bunx vitest run --reporter=minimal`. Opcional: `npx @playwright/mcp` para inspecionar o site.

---

## Regras críticas

1. **Setup obrigatório** — consumidores importam o CSS uma vez (já inclui `materials.css`, temas e utilitários) e registram o plugin Vite (script anti-FOUC + `ssr.noExternal` para TanStack Table e Shiki):
   ```ts
   import "@codeatlasdev/ui/styles/global.css";
   ```
   ```ts
   // vite.config.ts
   import { caThemePlugin } from "@codeatlasdev/ui/vite";
   export default defineConfig({ plugins: [sveltekit(), caThemePlugin()] });
   ```
   ```ts
   // src/hooks.server.ts: injeta o script de tema em páginas SSR/prerenderizadas
   import { sequence } from "@sveltejs/kit/hooks";
   import { caThemeHandle } from "@codeatlasdev/ui/kit";
   export const handle = sequence(caThemeHandle());
   ```

2. **`backdrop-filter` + `will-change: transform`** — nunca combine os dois no mesmo elemento ou ancestral. Mata o blur do glass.

3. **`isolation: isolate`** — `backdrop-filter` dentro de um pai `isolation: isolate` captura o contexto isolado, não o backdrop real.

4. **Svelte 5 runes** — todo o código usa runes (`$state`, `$derived`, `$effect`, `$props`). Nunca use `writable`/`readable` legados.

5. **`{@const}`** — válido apenas como filho imediato de `{#each}`, `{#if}`, `{#snippet}`, `{:else}`, ou `Component`. Nunca dentro de `<div>` ou outro elemento.

6. **`svelte:component`** — deprecated em runes mode. Use `{@const Icon = X}<Icon />` ou `<X />` diretamente.

7. **`class:` em Bits UI** — inválido em componentes Bits UI (não são elementos nativos). Passe `class` como string expression.

8. **Bits UI sub-components** — `DropdownMenu.Item` etc. não são mágicos. Cada sub-componente é um arquivo `.svelte` separado exportado com nome.

9. **OKLCH** — toda a paleta de cores usa OKLCH. MUI não aceita OKLCH direto — se integrar com MUI, converta para hex.

10. **Sem CSS inline** — nunca `style="padding: 20px"` ou `style="max-width: 480px"`. Use classes CSS com tokens (`var(--ca-space-5)`). A única exceção é CSS custom properties dinâmicos: `style="--bar-w:{pct}%"`.

11. **Sem `Stack`/`Row` para layout de campos dentro de `FormSection`** — `FormSection` já tem `layout="grid"` (padrão), `layout="list"` e `layout="stack"`. Não envolva campos em `Stack gap={N}` como workaround de layout.

12. **Classes `ca-*` são contrato público** — apps consumidores usam as classes BEM (`.ca-btn`, `.ca-dialog__body`, …) como alvo de CSS. Renomear ou remover classe `ca-*` listada em [`docs/css-api.md`](docs/css-api.md) = **breaking change**. Ao criar/renomear componente, atualize esse arquivo.

13. **Mobile** — alturas com `var(--ca-vh)` (nunca `100vh`/`100dvh`); UI `fixed` usa `var(--ca-safe-*)`; formulário com teclado usa `use:keyboardAware` (`@codeatlasdev/ui/actions`); tela cheia no mobile é `MobilePane`, barra de ações é `StickyActions`; alvo de toque de 44px é global em `(pointer: coarse)`, não escreva override no app. Viewport do app: `width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content`.

14. **Tema** — um único `ThemeOptions` em `src/lib/theme.ts` (objeto simples, `import type` apenas: `vite.config`/`astro.config` carregam o arquivo em Node, onde a raiz do pacote não avalia `.svelte`), passado a `caThemeHandle` + `caThemePlugin` (SvelteKit) ou `caUI` (Astro). Sobrescreva token declarando `--ca-*` em `:root` no app, sem `!important`. Ilhas locais: `data-theme-scope="dark|light"`. Setup automático: `bunx @codeatlasdev/ui init`.

15. **SEO** — página pública usa `<Seo>` de `@codeatlasdev/ui/seo` com `canonical` obrigatório; página privada passa `noindex`.

16. **Descobrir a API** — nunca adivinhe prop. Use o servidor MCP `ca-ui-mcp` (`get_component`, `list_components`, `search_tokens`, `get_guide`) ou `.agents/skills/codeatlas-ui/API.md`; ambos são gerados do código por `packages/ui/scripts/build-manifest.ts` (roda no `build`). Dev warnings `[ca-ui]` (via `devWarn`, `esm-env`) avisam de `IconButton` sem `aria-label` e `Dialog` sem `title`.

---

## Sistema de spacing (tokens globais)

**Todos os componentes usam variáveis CSS, nunca valores px hardcoded.**

```css
/* Spacing scale: base 4px */
--ca-space-1:  4px
--ca-space-2:  8px
--ca-space-3:  12px
--ca-space-4:  16px
--ca-space-5:  20px
--ca-space-6:  24px
--ca-space-7:  28px
--ca-space-8:  32px
--ca-space-10: 40px
--ca-space-12: 48px
--ca-space-16: 64px

/* Page layout: padding consistente entre TODOS os layouts de página */
--ca-page-px:    24px   /* padding horizontal padrão */
--ca-page-px-sm: 16px   /* padding horizontal mobile */
--ca-page-pt:    20px   /* padding top padrão */
--ca-page-pt-sm: 14px   /* padding top mobile */
--ca-page-gap:   20px   /* gap entre seções */
```

---

## Classes utilitárias (`global.css` → disponíveis em todo app)

Importadas automaticamente via `global.css`. Não precisam de nenhuma configuração extra.

| Classe | Uso |
|---|---|
| `ca-search-field` | Campo de busca no toolbar — `flex:1`, `min-width:180px`, `max-width:320px` |
| `ca-toolbar-spacer` | `flex:1` — empurra itens pro lado direito do toolbar |
| `ca-page-info` | Texto "1–8 of 240" no footer de paginação |
| `ca-row-actions` | Ações de linha — invisíveis por padrão, visíveis no hover |
| `ca-btn-danger` | Outlined button vermelho |
| `ca-btn-danger-ghost` | Ghost/text button vermelho |
| `ca-bar-fill` | Barra de progresso dinâmica — usa `--bar-w` CSS var |
| `ca-bar-fill--warn` | Variante warning da barra |
| `ca-pricing-cta` | Botão de CTA no fundo de pricing card (`width:100%; margin-top:auto`) |

---

Esta é a regra mais importante para manter consistência no site e em apps reais.

### `AppList` — listagem/CRUD fullscreen

**Quando usar:** página de listagem de entidades (usuários, pedidos, faturas, etc.)

Comportamento: a página NÃO rola. Só a tabela rola. Header, toolbar e footer de paginação ficam fixos.

```svelte
<AppList title="Users" data={users} searchKeys={['name', 'email']} perPage={8}>
  {#snippet actions()}
    <Button variant="filled" href="/users/new">+ New user</Button>
  {/snippet}

  {#snippet filters(list)}
    <FilterGroup options={roleOpts} value={list.filters['role']}
                 onchange={(v) => list.setFilter('role', v)} />
  {/snippet}

  {#snippet children(list)}
    <SimpleTable>
      <thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead>
      <tbody>
        {#each list.rows as u (u.id)}
          <tr>
            <td class="primary"><UserCell name={u.name} email={u.email} /></td>
            <td>{u.role}</td>
            <td><StatusChip status={u.status === 'active' ? 'success' : 'neutral'} /></td>
          </tr>
        {/each}
      </tbody>
    </SimpleTable>
  {/snippet}
</AppList>
```

Com `data`, o `AppList` renderiza busca, contagem, paginação e empty state sozinho. Use `toolbar`/`footer` manuais apenas quando a paginação é feita no servidor.

---

### `AppForm` — formulário de criação/edição

**Quando usar:** página de criação ou edição de uma entidade (New User, Edit Post, etc.)

Comportamento: header e footer ficam fixos. Só o corpo do form rola.

```svelte
<AppForm title="New User" description="Fill in the details to create a new user.">
  {#snippet leading()}
    <!-- botão de voltar fica aqui -->
    <Button variant="ghost" size="sm" href="/users">
      {#snippet leading()}<ArrowLeft size={15} />{/snippet}
    </Button>
  {/snippet}

  <!-- FormSection layout="grid" é o padrão: campos de texto ficam em 2 colunas -->
  <FormSection title="Account details" description="Basic information.">
    <TextField label="Full name" bind:value={name} />
    <TextField label="Email" type="email" bind:value={email} />
    <Select label="Role" bind:value={role} options={roleOpts} />
  </FormSection>

  <!-- layout="list" para Switch, SettingItem, Divider -->
  <FormSection title="Notifications" layout="list">
    <Switch label="Send welcome email" bind:checked={notify} />
  </FormSection>

  {#snippet footer()}
    <Button variant="ghost" href="/users">Cancel</Button>
    <Button variant="filled" onclick={save} disabled={saving || !name || !email}>
      {saving ? 'Saving…' : 'Create user'}
    </Button>
  {/snippet}
</AppForm>
```

**Regras do `AppForm`:**
- Botão de voltar vai no `{#snippet leading()}`, não como primeiro filho do form
- Ações de cancelar/salvar vão no `{#snippet footer()}`, nunca no body
- Não passe `maxWidth` — o conteúdo ocupa todo o espaço disponível
- `FormSection` default `layout="grid"` funciona para campos de texto
- `FormSection layout="list"` para Switch/SettingItem (sem gap, flush)
- `FormSection layout="stack"` para blocos compostos (Avatar + campos)

---

### `AppSettings` — configurações com navegação lateral

**Quando usar:** página de configurações com múltiplas seções (Workspace, Notifications, Security, etc.)

Comportamento: nav lateral fixa à esquerda. Conteúdo direito rola.

```svelte
<script lang="ts">
  import { AppSettings, FormSection, SettingItem, Switch, Button, Divider } from '@codeatlasdev/ui';
  import { Settings, Bell, Shield } from '@lucide/svelte';

  const TABS = [
    { value: 'general',  label: 'General',       icon: Settings },
    { value: 'notifs',   label: 'Notifications',  icon: Bell     },
    { value: 'security', label: 'Security',       icon: Shield   },
  ];

  let tab    = $state('general');
  let saving = $state(false);

  function save() { saving = true; setTimeout(() => (saving = false), 900); }
</script>

<AppSettings
  title="Settings"
  description="Manage your workspace."
  tabs={TABS}
  activeTab={tab}
  onTabChange={(t) => (tab = t)}
>
  {#snippet actions()}
    <Button variant="filled" size="sm" onclick={save} disabled={saving}>
      {saving ? 'Saving…' : 'Save changes'}
    </Button>
  {/snippet}

  {#if tab === 'general'}
    <FormSection title="Workspace">
      <TextField label="Name" bind:value={workspaceName} />
      <Select label="Timezone" bind:value={timezone} options={tzOpts} />
    </FormSection>
  {/if}

  {#if tab === 'notifs'}
    <FormSection title="Email" layout="list">
      <SettingItem label="New signups" description="Email on every new user.">
        <Switch bind:checked={emailSignup} />
      </SettingItem>
      <Divider />
      <SettingItem label="System errors" description="Critical alerts.">
        <Switch bind:checked={emailErrors} />
      </SettingItem>
    </FormSection>
  {/if}
</AppSettings>
```

**Regras do `AppSettings`:**
- Não passe `maxWidth` — o conteúdo ocupa toda a área disponível
- Cada tab renderiza com `{#if tab === 'x'}` no body
- `FormSection layout="list"` para `SettingItem` + `Switch` (o padrão mais comum em settings)
- `FormSection layout="grid"` para campos de texto (nome, email, etc.)
- Ações globais (Save/Cancel) ficam no `{#snippet actions()}`

---

### `MobilePane` e `StickyActions` — mobile nativo

```svelte
<MobilePane bind:open={chatOpen} title="Maria" onback={() => (chatId = null)}>
  {#snippet actions()}<IconButton aria-label="Mais">…</IconButton>{/snippet}
  <Messages />
</MobilePane>

<StickyActions align="stretch" show={dirty}>
  <Button variant="ghost">Cancelar</Button>
  <Button variant="filled">Salvar</Button>
</StickyActions>
```

`MobilePane`: `bind:open`, `title`, `onback?`, `actions?`, `headerTitle?` (substitui o texto do título), `scroll=true` (`false` quando o corpo tem rolagem e compositor próprios). Nunca monte `position: fixed` à mão para telas cheias no mobile. `AuthLayout` mostra uma faixa de marca abaixo de 768px (`mobileBrand`, padrão `true`); não crie um `AuthBrand` local.

---

### `PageShell` — dashboard e páginas de conteúdo livre

**Quando usar:** dashboard, relatórios, analytics. Qualquer página que não é lista, form ou settings.

```svelte
<PageShell title="Dashboard" description="Monday, Sep 22, 2026" maxWidth="1200px" gap={24}>
  {#snippet actions()}
    <Button variant="ghost" size="sm">Export</Button>
  {/snippet}

  <Grid cols="repeat(auto-fill, minmax(200px, 1fr))" gap={16}>
    <KpiCard title="Revenue" value="$112k" trend={18.4} icon={DollarSign} />
    <KpiCard title="Users"   value="24.8k" trend={12.1} icon={Users}      />
  </Grid>

  <GlassCard title="Revenue vs Expenses">
    <LineChart series={[...]} categories={months} area height="260px" />
  </GlassCard>
</PageShell>
```

---

## `FormSection` — referência rápida

| `layout` | Usar quando | Comportamento |
|---|---|---|
| `"grid"` (padrão) | `TextField`, `Select`, `NumberField` | Auto-fill 2 colunas, `minmax(260px, 1fr)` |
| `"list"` | `Switch`, `SettingItem`, `Divider` | Coluna única, sem gap entre itens |
| `"stack"` | Blocos compostos (Avatar + campos, grupos) | Coluna única, `gap: 16px` |

**Nunca** envolva campos em `<Stack gap={N}>` dentro de `FormSection`. Deixe o `layout` trabalhar.

---

## Componentes disponíveis

### Layout de página (App-level)
| Componente | Uso |
|---|---|
| `AppList` | Listagem fullscreen — tabela com scroll interno, paginação fixa |
| `AppForm` | Formulário — header + scroll body + footer sticky |
| `AppSettings` | Configurações — nav lateral + conteúdo scrollável |
| `PageShell` | Dashboard/conteúdo — scroll normal, max-width, gap configurável |
| `MobilePane` | Tela cheia acima do shell no mobile (thread de chat, histórico, detalhe) — header com voltar, Escape fecha, foco entra/volta, safe-area e teclado virtual |
| `StickyActions` | Barra de ações de formulário colada ao fim do scroll (`align="end" \| "stretch"`, `show`) — vidro, safe-area e teclado virtual |

### Layout de conteúdo
| Componente | Uso |
|---|---|
| `FormSection` | Seção de form — título, descrição, grid/list/stack de campos |
| `SettingItem` | Row de configuração — label + descrição + controle (Switch, Button) |
| `GlassCard` | Container glass genérico |
| `KpiCard` | Card de métrica — valor, trend, ícone |
| `Grid` | Grid CSS com `cols` e `gap` configuráveis |
| `Row` | Flex row com `gap`, `align`, `justify` |
| `Stack` | Flex column com `gap` |
| `EmptyState` | Estado vazio com ícone, título, ação |

### AppShell (shell de app)
| Componente | Descrição |
|---|---|
| `AppShellLayout` | Layout raiz — Rail + Panel + conteúdo |
| `Rail` | Dock lateral 52px. Logo via `{#snippet brand()}`, ações via `{#snippet railBottom()}` |
| `Panel` | Painel de navegação 200px com spring animation |
| `BottomNav` | Navegação inferior para mobile |
| `MobileHeader` | Header mobile |

### Superfícies glass
| Componente | Uso |
|---|---|
| `GlassSurface` | Container glass genérico com material e espessura configuráveis |
| `GlassCard` | Card glass com padding padrão, título opcional, `flush`, `full` |
| `LiquidGlass` | Efeito Liquid Glass com distorção de fundo |

### DataTable (TanStack Table v9)
```ts
import { DataTable, createCaTable, createCaColumnHelper, caTableFeatures } from "@codeatlasdev/ui/table";
```
- Server-side: `createCaTable` + `caTableFeatures` para sorting/filtering/pagination server-side
- `CaColumnDef<T>` — tipo para colunas com metadados (`meta.label`, `meta.filterVariant`)
- Para listas simples use `SimpleTable` + `UserCell` + `StatusChip` — mais leve

### Display
`Avatar` · `Image` · `Badge` · `Alert` · `Chip` · `StatusChip` · `KpiCard` · `EmptyState` · `Timeline` · `Sparkline` · `SimpleTable`

- **`SimpleTable` `responsive`** — `"scroll"` (padrão) ou `"cards"`. Em `cards`, abaixo de `md` cada `<tr>` vira um card e cada `<td>` mostra seu rótulo via `::before { content: attr(data-label) }`. **Obrigatório: passe `data-label="Coluna"` em cada `<td>`** (célula sem `data-label` fica sem rótulo). Dispensa wrappers de scroll locais.
  ```svelte
  <SimpleTable responsive="cards">
    <thead><tr><th>Nome</th><th>Status</th></tr></thead>
    <tbody>{#each rows as r}<tr><td data-label="Nome">{r.nome}</td><td data-label="Status">{r.status}</td></tr>{/each}</tbody>
  </SimpleTable>
  ```
- **Alvo de toque** — `--ca-touch-target: 44px` (`tokens.css`). Sob `@media (pointer: coarse)` vira `min-height`/`min-width` de `IconButton`, trigger de `Select`, `TabsTrigger`, `ToggleGroup`, `SegmentedControl`, `PinInput` e células do calendário. É media query, não prop: não escreva overrides de 44px no app.

### Inputs (wrappers Bits UI com glass tokens)
`Button` · `IconButton` · `TextField` · `TextArea` · `Select` · `Combobox` · `Checkbox` · `Switch` · `Slider` · `NumberField` · `FileUpload` · `ToggleGroup` · `SegmentedControl` · `PinInput` · `CopyButton` · `DatePicker` · `DateRangePicker` · `DateField` · `TimeField` · `Calendar` · `RangeCalendar`

- **`Button` / `IconButton` `loading`** — troca `leading` (Button) ou o ícone (IconButton) por `Spinner`, aplica `aria-busy="true"`, desabilita o clique (`onclick` não dispara) e mantém o label. Classe: `ca-btn--loading`.
- **`ToggleGroup`** — `type="single" | "multiple"`, `bind:value` (`string` ou `string[]`), `items: { value, label?, icon?, disabled?, 'aria-label'? }[]` (item só com ícone exige `aria-label`), `size="sm" | "md"`, `variant="outlined" | "ghost"`, `orientation`, `onchange`.
- **`SegmentedControl`** — `ToggleGroup` single com pílula deslizante (`.ca-seg__thumb`, sem animação em `reducedMotion`). Props: `bind:value`, `items`, `size="sm" | "md"`, `fullWidth`, `disabled`, `onchange`.
- **`PinInput`** — OTP. `length=6`, `bind:value`, `type="numeric" | "text"`, `label`, `description`, `error`, `mask`, `oncomplete(value)`.
- **`CopyButton`** — `value`, `label="Copiar"` (`''` = só ícone), `size`, `variant="ghost"`, `toast?: string` (mensagem de sucesso), `oncopy`. Ícone vira `Check` por 2s.
- **Datas** (valores `DateValue` de `@internationalized/date`, re-exportados pela raiz: `CalendarDate`, `Time`, `today`, `parseDate`…): `locale="pt-BR"`, `weekStartsOn=1`, `minValue`, `maxValue`, `label`, `description`, `error`, `disabled`, `required`, `bind:value`.
  - `DatePicker` — campo + popover com calendário (`bind:open`, `granularity`, `numberOfMonths`, `closeOnDateSelect`, `name`, `triggerLabel`)
  - `DateRangePicker` — `value: DateRange` (`{ start, end }`), `closeOnRangeSelect`
  - `DateField` — só os segmentos digitáveis, sem popover
  - `TimeField` — `value: Time`, `granularity="hour" | "minute" | "second"`, `hourCycle`
  - `Calendar` / `RangeCalendar` — grade inline (`fixedWeeks`, `isDateDisabled`, `isDateUnavailable`)

```svelte
<Button loading={saving} onclick={save}>Salvar</Button>
<SegmentedControl bind:value={view} items={[{ value: "list", label: "Lista" }, { value: "grid", label: "Grade" }]} />
<DatePicker label="Entrega" bind:value={date} minValue={today(getLocalTimeZone())} />
<TimeField label="Horário" bind:value={time} />
<PinInput length={6} oncomplete={verify} />
```

### Overlays
`Dialog` · `AlertDialog` · `Drawer` · `DropdownMenu` · `Popover` · `Tooltip` · `CommandPalette` · `NotificationBell`

- **`AlertDialog`** — confirmação que exige resposta (`role="alertdialog"`, sem "X", clique fora não fecha). Props: `bind:open`, `title`, `description?`, `confirmLabel="Confirmar"`, `cancelLabel="Cancelar"`, `destructive?`, `pending?`, `onconfirm: () => void | Promise<void>`, `oncancel?`. `onconfirm` async: confirmar mostra spinner, Cancelar desabilita e fecha ao resolver (permanece aberto se lançar). Substitui `confirm()` nativo.
- **`Sheet`** — bottom sheet abaixo de 768px, diálogo centralizado acima. `swipeToDismiss = true` (só no layout bottom): arraste a alça ou o cabeçalho (`.ca-sheet__grab`, `touch-action: none`, pointer capture) para baixo; fecha com mais de 30% da altura ou velocidade acima de 0.5 px/ms, senão volta com `Spring`. Desligado sob `reducedMotion`. O painel move por `translate` (sem `transform`, sem backdrop-filter no painel). Overlay e corpos roláveis de Sheet/Drawer/Dialog usam `touch-action: none` / `overscroll-behavior: contain`; o scroll lock do bits-ui basta no WebKit (sem `scroll-lock.ts`).
- **`Dialog`** — `size="sm" | "md" | "lg" | "xl" | "split"`. `split` = 1100×720, grid de 2 colunas em ≥`md`, 1 coluna abaixo. `chromeless` omite header/description/actions e zera o padding do body (passe `title` para o nome acessível, fica oculto visualmente).
```svelte
<AlertDialog bind:open title="Excluir lead?" description="Não pode ser desfeito." confirmLabel="Excluir" destructive onconfirm={() => api.remove(id)} />
<Dialog bind:open size="split" chromeless title="Lead">…</Dialog>
```

### Navegação
`Tabs` · `TabsList` · `TabsTrigger` · `TabsContent` · `Breadcrumb` · `Pagination` · `Stepper`

### Docs (sites de documentação)
`DocsShell` (header + sidebar + índice da página; no mobile um header compacto e menu em `Sheet`) · `DocsNav` · `TableOfContents` (`variant="rail" | "inline"`) · `DocsSearch` + `searchDocs` · `CodeTabs`/`CodeTab` (copy, `sync` entre grupos) · `Callout` · `Steps` · `LinkCard` · `CardGrid` · `MethodBadge`. Tipografia de markdown: envolva o HTML em `<div class="ca-prose">`; tabelas em `.ca-table-wrap`, código em `.ca-code` (shiki dual theme). O destaque de sintaxe fica com o consumidor (shiki em build).

```svelte
<DocsShell {sections} active="api" {groups} {pathname} {headings}
  searchIndex={() => fetch('/search.json').then((r) => r.json())} onnavigate={goto}>
  {#snippet brand()}<Logo /> Docs{/snippet}
  <article class="ca-prose">…</article>
</DocsShell>
```

### Feedback
`Spinner` · `Skeleton` · `Progress` · `Toast` · `Toaster`

### Charts (ECharts): `@codeatlasdev/ui/charts`, requer `echarts` instalado
`LineChart` · `BarChart` · `PieChart` · `ScatterChart` · `HeatmapChart` · `GaugeChart` · `RadarChart` · `Sparkline`

### Subpaths com peer opcional
Charts, DataTable e CodeSnippet NÃO saem do import raiz. Cada subpath exige seu peer:

| import | peer |
|---|---|
| `@codeatlasdev/ui/charts` | `echarts` |
| `@codeatlasdev/ui/table` | `@tanstack/svelte-table` |
| `@codeatlasdev/ui/code` | `shiki` |
| `@codeatlasdev/ui/forms` | nenhum (máscaras BR, `MoneyInput`, campos prontos) |

### `@codeatlasdev/ui/forms` — campos brasileiros
```ts
import { MaskedField, MoneyInput, PhoneField, CepField, mask,
  maskCPF, maskCNPJ, maskCPFCNPJ, maskCEP, maskPhoneBR, maskDateBR, maskRG,
  isValidCPF, isValidCNPJ, isValidDateBR, centsToDisplay, parseInputToCents } from "@codeatlasdev/ui/forms";
```
| Símbolo | Uso |
|---|---|
| `MaskedField` | `TextField` + `mask: (raw) => string` + `validate?: (v) => string \| undefined` (roda no blur). `inputmode` automático (`numeric` para CPF/CEP/telefone/data) |
| `MoneyInput` | `value` em **centavos** (inteiro, bindable). `123456` exibe `R$ 1.234,56`. Props: `min`, `max`, `allowNegative` (padrão `false`), `onchange(cents)` |
| `PhoneField` | `value` bindable em **E.164** (`+5511987654321`; `''` se incompleto). `country="BR"` |
| `CepField` | `bind:value` mascarado + `onlookup?: (cep) => Promise<CepAddress \| null>` (o pacote não faz fetch: injete ViaCEP), `onresolve(address)`, `bind:lookupPending` para desabilitar campos dependentes |
| `maskCPF` `maskCNPJ` `maskCPFCNPJ` `maskCEP` `maskPhoneBR` `maskDateBR` `maskRG` | Funções puras `(raw: string) => string` |
| `isValidCPF` `isValidCNPJ` `isValidDateBR` | Validação (dígitos verificadores / data real) |
| `centsToDisplay(cents)` · `parseInputToCents(text)` | `123456` ⇄ `"R$ 1.234,56"` |
| `use:mask={maskCPF}` | Action para `<input>` nativo; preserva o cursor (conta dígitos antes do caret) |

```svelte
<MaskedField label="CPF" mask={maskCPF} validate={(v) => (isValidCPF(v) ? undefined : "CPF inválido")} bind:value={cpf} />
<MoneyInput label="Valor" bind:value={cents} min={0} />
<PhoneField label="WhatsApp" bind:value={e164} />
<CepField label="CEP" bind:value={cep} bind:lookupPending onlookup={viaCep} onresolve={(a) => (rua = a.logradouro)} />
```

`useForm` (raiz) aceita `arrays` para linhas repetíveis. Cada array é um `FieldArrayState<T>` com `items`, `add(item)`, `remove(index)` e `move(from, to)`:
```ts
const form = useForm({ nome: "" }, { arrays: { telefones: [{ numero: "" }] } });
form.arrays.telefones.add({ numero: "" });
form.arrays.telefones.move(0, 1);
```

---

## Tokens TypeScript

```ts
import {
  caColors,      // paleta OKLCH completa por preset
  caTypography,  // escala de tipografia (h1..h6, body1, body2, caption, label, button)
  caShape,       // raios de borda (xs, sm, md, lg, xl, pill)
  caTransitions, // easing e duração (fast, base, slow, spring)
  caZIndex,      // z-index scale (nav, dropdown, sticky, fixed, drawer, modal, snackbar, tooltip)
  caShadows,     // sombras
  caMaterials,   // tokens de material (regular, thick, thin, ultrathin, ultrachick)
} from "@codeatlasdev/ui";
```

---

## CSS tokens (variáveis CSS)

```
/* Tipografia */
--ca-font-size-h1..h6 / body1 / body2 / caption / label / button

/* Raio */
--ca-radius-xs / sm / md / lg / xl / pill

/* Z-index */
--ca-z-nav / dropdown / sticky / fixed / drawer / modal / snackbar / tooltip

/* Animação */
--ca-ease-standard / decelerate / accelerate / spring
--ca-duration-fast / base / slow

/* Glass */
--ca-glass-bg / --ca-glass-separator / --ca-glass-tint-* / --ca-glass-border
--ca-blur-ultra-thin / thin / regular / thick / chrome

/* Cores semânticas */
--ca-brand-main / --ca-brand-light / --ca-brand-dark / --ca-brand-contrast / --ca-brand-h
--ca-semantic-success / warning / error / info
--ca-text-primary / secondary / disabled
--ca-surface-base / raised / sunken / overlay
--ca-outline-subtle / default / strong
--ca-action-hover / selected / disabled

/* Spacing (base 4px) */
--ca-space-1 (4px) .. --ca-space-16 (64px)

/* Layout de página */
--ca-page-px    (24px)  ← padding horizontal de todas as páginas
--ca-page-px-sm (16px)  ← mobile
--ca-page-pt    (20px)  ← padding top
--ca-page-gap   (20px)  ← gap entre seções
```

---

## Temas

```html
<html data-preset="ocean">
<!-- ocean | amber | crimson | cyan | violet | emerald | rose | slate -->
<html class="dark">
```

### Tema da marca

O produto tem cor própria? Gere um preset a partir do hex da logo. A lib deriva matiz, croma e luminosidade (OKLCH) e emite o conjunto completo de tokens, claro e escuro, inline no `<head>`. Sem flash.

```ts
// src/lib/theme.ts: um só lugar, usado pelo hook e pelo plugin
import type { ThemeOptions } from "@codeatlasdev/ui"; // = Partial<ThemeDefinition>

export const theme: ThemeOptions = {
  presets: [{ id: "acme", color: "#2563eb" }],
  defaultPreset: "acme",   // usado até o usuário escolher outro
  defaultScheme: "system", // "light" | "dark" | "system"
  defaultStyle: "glass",   // "glass" | "frosted" | "solid" | "flat"
  fonts: { body: "Geist, system-ui, sans-serif" },
  radius: 1,               // multiplicador da escala de raio
  density: "comfortable",  // ou "compact"
  overrides: { light: { "--ca-card-padding": "16px" } },
};

// src/hooks.server.ts
export const handle = sequence(caThemeHandle(theme));

// vite.config.ts
plugins: [sveltekit(), caThemePlugin(theme)]
```

- `id` não pode colidir com um preset embutido; `defaultPreset` precisa existir (erro no build).
- O script de init descarta valores salvos que o app não conhece (preset antigo, scheme/style inválido) e cai no default.
- Define `<meta name="theme-color">` com a superfície do preset e segue o SO em `system` antes do JS carregar.
- Gráficos usam o hex da marca como primeira série.
- `colorScheme` herda os defaults: `colorScheme.preset` começa em `"acme"`.

### Cascata e sobrescrita de tokens

`global.css` declara `@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.components, ca.materials, ca.utilities`. O CSS dos componentes e o do app ficam fora de camada e vencem sempre. Para sobrescrever tokens do pacote basta declarar `--ca-*` em `:root` no app, sem `!important`.

`global.css` = `core.css` (inclui só o preset `amber`) + os 7 presets restantes. Apps que usam um preset só importam `styles/core.css` + `styles/presets/<id>.css` (ver `site/.../getting-started/performance.mdx`).

Os presets embutidos são gerados: edite `packages/ui/src/lib/theme/builtins.ts` e rode `bun run --cwd packages/ui themes` (o `validate` falha se `styles/presets/*.css` estiver desatualizado).

### Ilhas de tema

```svelte
<section data-theme-scope="dark">…tokens do modo escuro aqui dentro, em qualquer página…</section>
```

### Tokens em runtime

`colorScheme.setTokens({ "--ca-brand-main": "#ff5500" })` grava um único `<style id="ca-runtime-tokens">`, persiste e é reaplicado pelo script de init antes do primeiro paint. `setTokens({})` limpa.

---

## Stores

```ts
import { colorScheme, reducedMotion, responsive } from "@codeatlasdev/ui";

colorScheme.init()          // no layout raiz (onMount); retorna cleanup
colorScheme.toggle()        // alternar dark/light
colorScheme.setPreset(id)   // trocar preset de cor (colorScheme.presets lista os válidos)
colorScheme.isDark          // boolean reativo

responsive.init()           // mede e passa a seguir resize; retorna cleanup
responsive.current          // 'xs' | 'sm' | 'md' | 'lg' | 'xl'; antes do init vale desktop
```

---

## Idioma (i18n)

Todo texto visível que o pacote gera (aria-label, placeholder, estados vazios, toasts, "Copiar", "Nesta página"…) vem de um catálogo. O padrão é **inglês**. Apps em português chamam `setLocale('pt-BR')` uma vez, no layout raiz.

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { setLocale } from "@codeatlasdev/ui";
  setLocale("pt-BR");   // "en" | "pt-BR"; roda no SSR também, antes do primeiro render
</script>
```

- O estado é um `$state` de módulo: todas as ilhas/apps da mesma página compartilham o idioma, e os componentes re-renderizam ao trocar. `locale.value` lê o atual.
- **Prop explícita sempre vence** o catálogo: `<TableOfContents label="Neste artigo" />`. Props de texto (`label`, `placeholder`, `confirmLabel`, `emptyText`, `ofLabel`…) não têm mais default; sem a prop, o componente usa o catálogo.
- **Sobrescrever frases** sem criar locale: `setLocale("pt-BR", { docs: { toc: "Neste artigo" } })`. O objeto é mesclado em profundidade sobre o catálogo; uma nova chamada a `setLocale` substitui os overrides anteriores.
- Catálogo: `packages/ui/src/lib/i18n/en.ts` (fonte da verdade, agrupado por componente, ex.: `docs.search.placeholder`) e `pt-BR.ts` (tipado como `Messages`: chave faltando é erro de tipo). Strings com valor são funções: `notificationBell.label(unread)`.
- Texto novo em componente: adicione a chave em `en.ts` **e** `pt-BR.ts`, leia com `t().grupo.chave` no markup/`$derived` (nunca em `const` de módulo, senão não reage à troca) e use `label ?? t().grupo.chave` quando houver prop.
- Em testes, chame `setLocale("pt-BR")` onde o teste confere texto em português e `setLocale("en")` no `afterEach`; o padrão é inglês.
- `locale` de data/número (`DatePicker locale="pt-BR"`, máscaras) é independente do idioma da UI.

---

## AppShell — padrão de uso

```svelte
<!-- Em qualquer layout de app autenticado -->
<AppShellLayout
  modules={MODULES}
  pathname={$page.url.pathname}
  persistPanel={false}
  onNavigate={(path) => goto(path)}
>
  {#snippet brand()}
    <!-- Logo no topo da Rail e no header mobile. Sem isso: "CA" -->
    <a href="/" aria-label="Acme"><AcmeLogo size={28} /></a>
  {/snippet}

  {#snippet railBottom()}
    <!-- Items fixos no bottom da rail: notificações, avatar, busca -->
    <button class="ca-rail-btn" onclick={() => (cmdOpen = true)}>
      <Search size={16} />
    </button>
    <NotificationBell {notifications} />
    <a href="/profile" class="ca-rail-avatar">
      <Avatar alt={user.name} size="sm" />
    </a>
  {/snippet}

  <!-- Sem {#snippet header()}. Header global foi removido -->
  <!-- Cada página define seu próprio "header" via AppList/AppForm/AppSettings/PageShell -->

  {@render children?.()}
</AppShellLayout>
```

**Regra:** `AppShellLayout` não tem header global. Cada página define seu próprio topo via `AppList` (header+toolbar), `AppForm` (header), `AppSettings` (header), ou `PageShell` (header+body).

---

## Relação com projetos consumidores

Todo app que consome o pacote deve:
1. Instalar `@codeatlasdev/ui` do npm público (sem `.npmrc`/auth)
2. Importar `@codeatlasdev/ui/styles/global.css` no layout raiz e registrar `caThemePlugin()` no `vite.config.ts`
3. Definir o tema da marca (`ThemeOptions`) e passar para `caThemeHandle` e `caThemePlugin`
4. Usar `AppShellLayout` como wrapper de layout raiz, com `brand` para a logo e `railBottom` para ações do usuário
5. Criar páginas usando `AppList`, `AppForm`, `AppSettings`, ou `PageShell` — nunca wrappers manuais

---

## Convenções de código

- Indentação: tabs (Biome)
- Aspas: duplas (Biome)
- Ponto-e-vírgula: sempre
- `lineWidth`: 100
- Sem Tailwind — estilos via CSS vars e classes
- Sem MUI neste pacote — é puro Svelte + Bits UI
- Sem CSS inline exceto CSS custom properties dinâmicos (`style="--bar-w:{pct}%"`)


## Performance (guardas do pacote)

- `bun run --cwd packages/ui size` (parte do `validate`) empacota cada entry com esbuild e compara o gzip com `packages/ui/size-limit.json`. O limite só desce: `size:update` reduz limites com folga; subir um limite é decisão manual, explicada no PR. Para adicionar uma entry, edite `ENTRIES` em `scripts/size-limit.ts`.
- `bun run --cwd packages/ui lint:tokens` (parte do `validate`) reprova: `will-change` em arquivo com `backdrop-filter`; `100vh|100dvh|100svh|100lvh` literal (use `var(--ca-vh)`); `backdrop-filter` declarado antes de `-webkit-backdrop-filter` (Lightning CSS descarta o padrão); `font-size` < 16px em regra de input (zoom no foco do iOS).
- Imagens de conteúdo: `Image` (exige `width`/`height`; `alt=""` exige `decorative`; `priority` só na imagem do LCP).
- Fontes: `defineTheme({ fonts: { body: { family, src, weight, preload, fallback, fallbackMetrics } } })` gera `@font-face`, o fallback com `size-adjust` e o `<link rel="preload">`. String continua valendo.
