# ADR 0002: `@codeatlasdev/ui/canvas`, an infinite canvas foundation

Status: proposed (2026-11-10). Owner: TBD. First consumer: R2K Kira journey editor (`codeatlasdev/r2k`, `docs/kira/V2.md` §5).
Supersedes: the Wave 5 `./canvas` line in `docs/roadmap.md` (Konva `CanvasStage`, peer `konva ^9`). That layout/signage editor becomes one kit on top of this foundation instead of the whole entry (see §10).

Every external claim below has a link and the date it was read. All sources were accessed on **2026-11-10**. Statements marked **[inference]** are our reasoning, not a quoted source.

---

## 1. Problem

CodeAtlas apps keep needing "a surface you pan and zoom with things on it":

| Consumer | Needs | Today |
|---|---|---|
| R2K Kira journey editor | 7 block types, typed handles, side panel editing the selected block, minimap, zoom, undo/redo, auto-layout (dagre), errors on blocks, a list view equivalent for phones and screen readers, test path highlighting | plan is raw `@xyflow/svelte` loaded only on that page (`r2k/docs/kira/V2.md` §5) |
| AC layout editor / signage editor | free shapes, text, images, transformer handles, snap guides, mm units | React + Konva in `ac/apps/*` (`docs/roadmap.md` Wave 5) |
| Future (agents board, whiteboard, FigJam/Miro/Maestri-like) | sticky notes, freehand, connectors, frames, presence, embedded live panels | nothing |

Without a foundation each app re-implements camera math, wheel/pinch handling, selection, history and a11y, and none of them looks like the rest of `@codeatlasdev/ui` (tokens, materials, 44px touch targets, top-layer overlays, agent-native docs).

## 2. Goals and non-goals

Goals
1. One optional subpath, `@codeatlasdev/ui/canvas`, layered so a flow editor does not pay for a whiteboard and neither pays for collaboration.
2. Framework-agnostic TypeScript core with thin Svelte 5 runes adapters (the core is unit-testable in `bun test` with no DOM).
3. Two rendering paths behind one scene model: DOM/SVG for rich interactive nodes, Canvas2D (later WebGL) for many simple shapes, composable in one viewport.
4. Theme-driven: every color, radius, shadow and material comes from `--ca-*` tokens and the current `defaultStyle`.
5. Accessible by construction: keyboard-operable graph, screen-reader alternative view, AA contrast, reduced motion.
6. Touch and trackpad as first-class input, not an afterthought.
7. A documented, JSON Canvas-compatible document format for import/export.

Non-goals (now): a Figma-class vector engine (boolean ops, masks, blend modes, WASM renderer); rich-text collaboration inside a node; a hosted sync server; 3D.

## 3. Research

### 3.1 Products and engines

**tldraw.** The `Editor` is the single control surface over a reactive store of records; changes run inside transactions, and `editor.run()` batches several changes into one undo step, with `history: 'ignore'` to skip history ([tldraw docs: Editor](https://tldraw.dev/docs/editor), 2026-11-10). State is built on its own signals library (`atom`, `computed`, `react`, `transact`, lazy cached computeds) in `@tldraw/state` ([tldraw: Signals](https://tldraw.dev/sdk-features/signals), 2026-11-10). Relationships between shapes are separate *binding* records (`fromId`, `toId`, `props`) with a `BindingUtil` lifecycle (`onAfterChangeToShape`, isolation callbacks when one side is deleted or copied alone) and an incrementally maintained bindings index ([tldraw: Bindings](https://tldraw.dev/sdk-features/bindings), 2026-11-10). Culling queries a spatial index for shapes intersecting the viewport and hides the rest with `display: none`; selected and editing shapes are never culled ([tldraw: Culling](https://tldraw.dev/sdk-features/culling), 2026-11-10). Performance guidance: "a canvas with 10,000 shapes might only render 50"; zoom is debounced above 500 shapes (`getEfficientZoomLevel`) so shapes don't re-render mid-zoom; geometry is cached; LOD drops shadows, dashes and text outlines at low zoom; default `maxShapesPerPage` is 4000 ([tldraw: Performance](https://tldraw.dev/sdk-features/performance), 2026-11-10). **License**: production use requires a trial or commercial license key; the license forbids production use otherwise, forbids interfering with license-key enforcement, and the software "may collect and transmit usage data" ([tldraw LICENSE.md](https://github.com/tldraw/tldraw/blob/main/LICENSE.md), 2026-11-10). npm `tldraw@5.6.0`, license "SEE LICENSE IN LICENSE.md" (`npm view`, 2026-11-10).
Takeaways: records + signals + transactions + bindings + spatial-index culling is the right *shape* of an engine; the code cannot be embedded or forked into an MIT library we publish.

**Excalidraw.** MIT, "infinite, canvas-based whiteboard", hand-drawn style, export to PNG/SVG/clipboard, `.excalidraw` JSON format, arrow binding ([Excalidraw README](https://github.com/excalidraw/excalidraw/blob/master/README.md), 2026-11-10). Rendering is split into a `StaticCanvas` (scene elements) and an `InteractiveCanvas` (selection, handles), with elements drawn through `roughjs` (`RoughCanvas`) ([StaticCanvas.tsx](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/canvases/StaticCanvas.tsx), [InteractiveCanvas.tsx](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/canvases/InteractiveCanvas.tsx), [renderElement.ts](https://github.com/excalidraw/excalidraw/blob/master/packages/element/src/renderElement.ts), 2026-11-10). Collaboration: a relay server forwards end-to-end encrypted messages; peers merge element arrays by id, delete via tombstones (`isDeleted`), resolve concurrent edits by per-element `version`, break ties with a random `versionNonce`; multiplayer undo was left unsolved (stack cleared on remote update) ([Excalidraw blog, 2020-03-29](https://excalidraw-blog-git-updates.excalidraw.vercel.app/building-excalidraw-p2p-collaboration-feature), 2026-11-10).
Takeaways: two stacked canvases (static scene vs interactive overlay) so moving a selection box does not repaint the scene; per-element version + nonce is a cheap, proven convergence rule.

**Figma.** Editor in C++ compiled to asm.js (now Wasm), custom tile-based WebGL renderer, because HTML/SVG "are usually optimized for scrolling, not zooming" and Canvas2D is immediate-mode; the trackpad pinch arrives as `wheel` with `ctrlKey` in Chrome, and Safari pinch was "impossible to disable" at the time ([Figma, 2015-12-07](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/), 2026-11-10). The renderer now runs on WebGPU with a dynamic fallback to WebGL when a device is lost mid-session ([Figma, 2025-09-18](https://www.figma.com/blog/figma-rendering-powered-by-webgpu/), 2026-11-10). Multiplayer: client/server over WebSockets; the document is `Map<ObjectID, Map<Property, Value>>`; last-writer-wins per property with the server ordering events; unacknowledged local values win over incoming ones to avoid flicker; parent link + fractional index stored as one property; undo modifies redo history so "undo a lot, copy, redo back" leaves the document unchanged ([Figma, 2019-10-16](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/), 2026-11-10). Prototypes load only the visible frame plus reachable neighbours ([Figma, 2024-01-23](https://www.figma.com/blog/incremental-frame-loading/), 2026-11-10).
Takeaways: property-level LWW + fractional indexing is enough for a visual editor; a custom GPU renderer is a multi-year bet that we do not need for flow editors.

**Miro / FigJam.** Miro's canvas engine renders widgets itself; for editing, an HTML editor (Ace) is overlaid and scaled with `transform: scale(board × widget)`; CodeMirror broke because it measures with `getBoundingClientRect()`, which ignores the transform; caret placement maps the click's screen point into editor coordinates ([Miro Engineering, 2023-10-30](https://medium.com/miro-engineering/how-we-integrated-a-code-editor-on-the-miro-canvas-a41e0eff7f21), 2026-11-10). FigJam now exposes its whiteboard to coding agents via MCP ([Figma, 2026-04-28](https://www.figma.com/blog/figjam-your-coding-agents-whiteboard/), 2026-11-10).
Takeaways: "render cheap, edit in DOM overlay" is the industry pattern for text on canvas; any DOM widget inside a scaled layer must be tested for transform-unaware measurement.

**Maestri.** A native macOS app (Swift/SwiftUI/AppKit, "GPU-accelerated via Metal", "MaestriCanvas engine, built from scratch"): an infinite canvas where each node is a live terminal running a coding agent; nodes are connected so agents prompt each other; also sticky notes written by agents, hand-drawn shapes and arrows, "portals" (embedded browser/simulator), "bands" (grouping terminals), one canvas per workspace, config as JSON and notes as Markdown files ([themaestri.app/pt-br](https://www.themaestri.app/pt-br), 2026-11-10).
Takeaways: the canvas is a *spatial container for live, heavy, interactive panels* plus light diagramming. That argues for first-class DOM nodes (embedded live content) with a cheap layer for drawings, and for a plain-JSON file format.

**xyflow (React Flow / Svelte Flow).** MIT; a monorepo with `@xyflow/react`, `@xyflow/svelte` and the shared `@xyflow/system` ([xyflow README](https://github.com/xyflow/xyflow), 2026-11-10). `@xyflow/system` depends on `d3-zoom`, `d3-drag`, `d3-selection`, `d3-interpolate`, `d3-transition` ([system/package.json](https://github.com/xyflow/xyflow/blob/main/packages/system/package.json), 2026-11-10). `@xyflow/svelte@1.7.1` peers `svelte ^5.25.0` (`npm view`, 2026-11-10); the API is `bind:nodes`/`bind:edges` on `$state.raw` arrays, default `minZoom 0.5`/`maxZoom 2`, `onlyRenderVisibleElements` off by default ("also adds an overhead"), `isValidConnection`, `connectionRadius 20`, `nopan`/`nodrag`/`nowheel` escape classes, `panActivationKey 'Space'` ([Svelte Flow API](https://svelteflow.dev/api-reference/svelte-flow), 2026-11-10). Performance guidance is about avoiding re-renders: memoize, don't subscribe to whole `nodes` arrays, collapse subtrees, simplify CSS (shadows/animations) ([React Flow: Performance](https://reactflow.dev/learn/advanced-use/performance), 2026-11-10). A11y: nodes/edges `tabIndex=0`, `role="group"` by default, Enter/Space select, arrow keys move, auto-pan on focus, `aria-live="assertive"` move announcements, localizable `ariaLabelConfig` ([React Flow: Accessibility](https://reactflow.dev/learn/advanced-use/accessibility), 2026-11-10).
Takeaways: the best reference for flow-editor API ergonomics; DOM-per-node caps scale in the low thousands **[inference from the above guidance]**; its theming is its own `--xy-*` variables and stylesheet, not our tokens; the Tab-through-every-node model does not scale for keyboard users on big graphs.

### 3.2 Interchange format: JSON Canvas 1.0

Top-level `nodes` and `edges`; nodes are `text | file | link | group` with integer `x, y, width, height`, optional `color`; array order is z-order; edges have `fromNode`, `fromSide`, `fromEnd`, `toNode`, `toSide`, `toEnd`, `color`, `label`; colors are hex or presets `"1"`–`"6"` whose values are intentionally undefined so apps map them to their palette ([JSON Canvas spec 1.0, 2024-03-11](https://jsoncanvas.org/spec/1.0/), 2026-11-10).
Fit: covers whiteboards and simple diagrams. Gaps for us: no typed ports (only sides), no custom node types, no rotation, no freehand, no pages. Plan: our document is a superset; unknown types round-trip through extra fields, and preset colors `"1"`–`"6"` map to theme tokens (§7).

### 3.3 Rendering technology trade-offs

| Tech | Strengths | Limits | Use here |
|---|---|---|---|
| DOM (HTML in a CSS-transformed layer) | real text, forms, focus, a11y tree, our components inside nodes, CSS theming | layout/paint cost per element; text blurs/relayouts on zoom; Figma calls HTML/SVG "optimized for scrolling, not zooming" ([Figma 2015](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/)) | flow nodes, sticky notes being edited, embedded panels |
| SVG | crisp vector edges/arrows, markers, hit-testing via DOM, exports to SVG for free | same DOM costs per path | edges, connection line, selection outlines (≤ ~2k paths **[inference]**) |
| Canvas2D | one element, thousands of primitives, cheap pan via redraw | immediate-mode: everything re-issued each frame ([Figma 2015](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/)); no a11y tree; text quality is ours to manage | whiteboard shapes, freehand, minimap, grid |
| WebGL / WebGPU | GPU batching, 10k–100k+ items | bundle, context loss, device fallback complexity ([Figma 2025](https://www.figma.com/blog/figma-rendering-powered-by-webgpu/)) | later, optional renderer for huge boards |
| OffscreenCanvas + worker | render off the main thread, `transferControlToOffscreen()`, `requestAnimationFrame` in workers ([MDN OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas), 2026-11-10) | input still on main thread; data must be posted/shared | Canvas2D renderer option for heavy boards |
| Konva `10.9.1` / PixiJS `8.22.0` (both MIT, `npm view` 2026-11-10) | scene graph + hit-testing (Konva), fast WebGL batching (Pixi) | they own the scene graph, events and hit-testing, duplicating our core; Pixi is large | not adopted as the base; a Konva-backed renderer is not needed once Canvas2D exists **[inference]** |

Decision: **hybrid**. One camera, stacked layers: Canvas2D background and bulk shapes, DOM layer for interactive nodes, SVG layer for edges, a top interactive overlay (selection, handles, snap guides) as in Excalidraw's static/interactive split.

### 3.4 Spatial indexing, culling, LOD

RBush (MIT, `4.0.1`): dynamic R-tree with bulk load (~2–3× faster than single inserts) and search "hundreds of times faster than looping"; for static points `kdbush` is 5–8× faster; `flatbush` (ISC, `4.7.0`) is the static packed variant ([rbush README](https://github.com/mourner/rbush), `npm view`, 2026-11-10). Culling + LOD as in tldraw (§3.1).
Plan: dynamic R-tree for the scene (inserts/moves on drag), rebuilt in bulk on load; a uniform grid is enough for snapping candidates. Write our own ~150-line R-tree or depend on `rbush` (≈ small, MIT); decision in Phase 0 by measurement.

### 3.5 Input: pointer, wheel, pinch, trackpad

- `WheelEvent.deltaMode` can be pixel, line or page; code must normalize and never assume pixels ([MDN deltaMode](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode), 2026-11-10).
- Trackpad pinch in Chromium arrives as `wheel` with `ctrlKey` and is cancelable with `preventDefault()` ([Figma 2015](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/), 2026-11-10).
- Safari exposes non-standard `gesturestart`/`gesturechange`/`gestureend` (WebKit-only `GestureEvent` with `scale`/`rotation`) ([MDN gesturestart](https://developer.mozilla.org/en-US/docs/Web/API/Element/gesturestart_event), 2026-11-10). Whether current Safari also sends ctrl+wheel for pinch must be verified on device in Phase 0 **[inference: treat both paths]**.
- Touch: Pointer Events with `touch-action: none` on the viewport, two-pointer pinch computed from pointer pairs, pointer capture for drags (same mechanism `Sheet` already uses, AGENTS.md "Sheet").
- Heuristic for "mouse wheel vs trackpad": pixel-mode deltas with fractional values or `deltaX ≠ 0` → trackpad pan; ctrl/meta + wheel → zoom; line/page mode → mouse, zoom or scroll per `wheelMode` prop **[inference; common practice, to be validated]**.

### 3.6 Accessibility

There is no ARIA "graph" pattern. The APG guidance applicable here: one tab stop per composite, arrow keys move inside it (roving `tabindex` or `aria-activedescendant`), focus and selection are distinct and both visible, focus must never fall to `<body>` after a delete ([WAI-ARIA APG: Developing a Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/), 2026-11-10). xyflow's model (every node `tabIndex=0`) is the baseline we improve on ([React Flow a11y](https://reactflow.dev/learn/advanced-use/accessibility), 2026-11-10).

### 3.7 History and collaboration

- Undo/redo: transaction-based command log (tldraw `run` + history modes; Figma's redo-rewriting rule).
- CRDTs: Yjs `13.6.33` (MIT) with a separate, non-persisted Awareness CRDT for presence/cursors ([Yjs docs: Awareness](https://docs.yjs.dev/getting-started/adding-awareness), 2026-11-10); Automerge `3.5.0` (MIT); Loro `1.17.1` (MIT) with movable tree/list and time travel, but "~970KB gzipped" Wasm ([Loro docs](https://loro.dev/docs), 2026-11-10). Ordering: `fractional-indexing` `4.0.0` (CC0) (`npm view`, 2026-11-10).
- Figma (server-ordered LWW) and Excalidraw (version + nonce) show a canvas does not need text-grade CRDTs unless text is co-edited.

### 3.8 Auto-layout

`@dagrejs/dagre` `3.1.3` (MIT) and `elkjs` `0.12.1` (**EPL-2.0 OR GPL-3.0-or-later**) (`npm view`, 2026-11-10). elkjs is the better layered/port-aware layout but its license must stay an app-level optional peer, never bundled **[inference: license compatibility to be confirmed by owner]**.

---

## 4. Architecture

```
@codeatlasdev/ui/canvas            (Svelte 5 adapters + primitives, no peer)
  ├─ core/        framework-agnostic TS: doc, camera, input, index, select, history, snap, io
  ├─ render/      dom · svg · canvas2d  (webgl later, optional peer)
  ├─ primitives/  Canvas, Viewport, Node, Edge, Handle/Port, Frame, Minimap, Controls, Background, ...
@codeatlasdev/ui/canvas/flow       FlowEditor kit (peer: @dagrejs/dagre optional; elkjs optional)
@codeatlasdev/ui/canvas/board      Whiteboard kit (peer: perfect-freehand optional)
@codeatlasdev/ui/canvas/yjs        collaboration adapter (peer: yjs)
```

Separate subpaths so each budget is measured on its own in `scripts/size-limit.ts`, the same way `./map` declares `external` peers. Heavy peers load lazily from `onMount` with an error naming the package to install, the `map/loader.ts` pattern.

### 4.1 Layer 1: core engine (TS, no DOM)

| Module | Responsibility |
|---|---|
| `doc` | Records store: `Map<id, Record>` for `node`, `edge`, `group`, `binding`; transactions; change events (`added/updated/removed` diffs). Ordering by fractional index (Figma). Runes adapter exposes fine-grained reactivity per record (one `$state.raw` per record id, not one array) so dragging one node does not invalidate the others (the xyflow pitfall). |
| `camera` | `{x, y, z}`; `screenToWorld`, `worldToScreen`, `zoomAt(point, factor)`, `fitBounds(rect, padding)`, `panBy`, clamps (`minZoom`, `maxZoom`, `translateExtent`), animated transitions (respect reduced motion). Pure math. |
| `input` | Normalized gesture stream from Pointer/Wheel/Gesture/Keyboard events: `pan`, `zoom`, `pinch`, `press`, `drag`, `longpress`, `doubletap`; deltaMode normalization; ctrl+wheel and `gesture*` pinch; pointer capture; drag threshold; tool state machine (`select`, `hand`, `connect`, `draw`, `text`, ...) like tldraw's tools. |
| `index` | Dynamic R-tree of world AABBs; `query(rect)`, `hit(point, tolerance)`; precise hit-test delegated to the node type's geometry (rect, ellipse, polyline, path). |
| `cull` | Visible set = `index.query(viewport ⊕ margin)` ∪ selected ∪ editing ∪ `canCull=false` (tldraw rule). Incremental. LOD level from *efficient zoom* (debounced while moving, tldraw). |
| `select` | Click, shift/meta toggle, marquee (`full` or `partial` containment), lasso (polygon), select-all, focus vs selection kept separate. |
| `history` | Transactions become undo steps; `history: 'record' | 'ignore'`; coalescing for drags and typing; `beginBatch/endBatch`; remote changes never enter the local stack; redo rewritten on undo (Figma rule) once collab exists. |
| `snap` | Grid snap, object snap (edges/centers of candidates from the index), distribution guides, port snap radius (`connectionRadius`), disable with Alt. |
| `bindings` | Edge↔port and connector↔shape relationships as records with lifecycle hooks (tldraw bindings): follow on move, isolate on delete/copy. |
| `io` | `toJSONCanvas(doc)`, `fromJSONCanvas(json)`, native `toJSON/fromJSON` (versioned schema + migrations), clipboard (`text/plain` JSON + `text/html` payload), `exportSVG`, `exportPNG` (render to OffscreenCanvas / canvas at a given scale), PDF via the `./pdf` entry (planned) or SVG → print. |

### 4.2 Layer 2: renderers

All renderers read the same culled set and camera.

- **DOM layer**: one container with `transform: translate3d(x,y,0) scale(z)`; nodes absolutely positioned in world units; `contain: layout paint style` per node; nodes measured once with `ResizeObserver` (size in world units, corrected for scale, avoiding the `getBoundingClientRect` trap Miro hit).
- **SVG layer**: edges, connection preview, markers; same transform; stroke width compensated by `vector-effect: non-scaling-stroke` where appropriate.
- **Canvas2D layer**: background grid/dots, bulk shapes, freehand, minimap; DPR-aware backing store; redraw on camera change in rAF; optional OffscreenCanvas worker.
- **Overlay**: selection rects, resize/rotate handles, snap guides, marquee, remote cursors. Separate so these repaint without touching the scene (Excalidraw split).
- **WebGL** (Phase 4, optional peer, only if a consumer needs >10k shapes at 60fps beyond what Canvas2D gives).

### 4.3 Layer 3: primitives (Svelte 5)

`Canvas` (root, context), `Viewport`, `Node`, `Edge`, `Handle`/`Port`, `Frame` (group), `Background` (`dots | lines | cross`, from tokens), `Minimap`, `Controls` (zoom in/out, fit, lock, built on `IconButton`), `SelectionBox`, `ContextMenu` integration (existing `ContextMenu` component, opened in the top layer), `Toolbar` (new: `role="toolbar"` with APG roving focus, composed from `ButtonGroup`/`IconButton`; there is no `Toolbar` component in the package today), floating in a `Panel` slot (`top-left | top-center | ... | bottom-right`), `Panel`, `ConnectionLine`, `EdgeLabel`.

### 4.4 Layer 4: kits

- **FlowEditor** (`./canvas/flow`): typed ports, connection validation, palette (drag or click-to-add), side-panel slot, auto-layout adapter (`dagre` default, `elk` opt-in), error badges per node, run/path highlighting, read-only mode, **list view** fallback (§8).
- **Whiteboard** (`./canvas/board`): sticky, rect/ellipse/diamond, arrow/connector with bindings, freehand (`perfect-freehand` MIT `1.2.3`, optional), text, image, frame; optional hand-drawn style via `roughjs` (MIT `4.6.6`) as an optional peer.
- **Layout editor** (absorbs roadmap Wave 5): mm units, transformer, snap guides, image/text/rect/line tools on the Whiteboard kit, no Konva.
- **Collaboration** (`./canvas/yjs`): maps doc records to `Y.Map` per record (property-level LWW, like Figma), presence/cursors via Yjs Awareness, remote cursors in the overlay, selection halos, follow mode.

---

## 5. API sketches (Svelte 5)

### 5.1 Core

```ts
import { createCanvas, type CanvasDoc } from '@codeatlasdev/ui/canvas';

const canvas = createCanvas({
  doc: initial,                    // native doc or fromJSONCanvas(json)
  camera: { minZoom: 0.1, maxZoom: 4 },
  snap: { grid: 8, objects: true },
  history: { limit: 200 },
});

canvas.run(() => {                 // one undo step
  canvas.nodes.create({ id: 'n1', type: 'message', x: 0, y: 0, data: { text: 'Olá' } });
  canvas.edges.create({ id: 'e1', from: { node: 'n0', port: 'out' }, to: { node: 'n1', port: 'in' } });
});
canvas.camera.fit({ padding: 48 });
canvas.history.undo();
const json = canvas.io.toJSONCanvas();
```

### 5.2 Primitives

```svelte
<script lang="ts">
  import { Canvas, Background, Minimap, Controls, Node, Port, Panel } from '@codeatlasdev/ui/canvas';
  import { Button } from '@codeatlasdev/ui';
  let doc = $state.raw(initialDoc);
  let selected = $state<string[]>([]);
</script>

<Canvas bind:doc bind:selected label="Mapa de atendimento" onchange={(diff) => save(diff)}>
  <Background variant="dots" />
  {#snippet node(n)}
    <Node {n} label={n.data.title}>
      <Port id="in" side="left" kind="target" accepts={['flow']} />
      <h3>{n.data.title}</h3>
      <Port id="out" side="right" kind="source" type="flow" />
    </Node>
  {/snippet}
  <Panel position="top-right"><Button size="sm">Publicar</Button></Panel>
  <Minimap />
  <Controls />
</Canvas>
```

### 5.3 FlowEditor (Kira journey editor)

```svelte
<script lang="ts">
  import { FlowEditor, defineBlocks } from '@codeatlasdev/ui/canvas/flow';

  const blocks = defineBlocks({
    trigger:  { label: 'Gatilho',  icon: Zap,        ports: { out: { kind: 'source', type: 'flow' } } },
    message:  { label: 'Mensagem', icon: MessageSquare,
                ports: { in: { kind: 'target', accepts: ['flow'] }, out: { kind: 'source', type: 'flow' } } },
    decision: { label: 'Decisão',  icon: GitBranch,
                ports: { in: { kind: 'target', accepts: ['flow'] },
                         yes: { kind: 'source', type: 'flow', label: 'Sim' },
                         no:  { kind: 'source', type: 'flow', label: 'Não' } } },
    // ... 7 types total
  });

  let flow = $state.raw(loaded);
  let selected = $state<string | null>(null);
</script>

<FlowEditor
  bind:flow
  bind:selected
  {blocks}
  layout="dagre"                       // or "elk" (optional peer) | false
  validate={(f) => kiraErrors(f)}      // → { nodeId, message }[] shown as badges + list
  highlight={testRunPath}              // ids lit by the simulator
  listView="auto"                      // list under 768px or when the user picks it
  label="Jornada da Kira"
>
  {#snippet panel(node)}<BlockForm {node} />{/snippet}   <!-- Sheet on mobile -->
  {#snippet card(node)}<BlockCard {node} />{/snippet}
</FlowEditor>
```

Connection validation is declarative (`accepts` vs `type`) plus an `isValidConnection(from, to, flow)` escape hatch; invalid drop targets dim while dragging and announce why.

---

## 6. Performance budgets

Measured on a mid-range laptop profile and a throttled mobile profile (CDP CPU throttling 4×, already used by `*.throttled.svelte.test.ts`). Numbers are targets to be confirmed in Phase 0 benchmarks **[inference]**.

| Scenario | Target |
|---|---|
| Pan/zoom, 10,000 simple shapes (Canvas2D layer) | p95 frame ≤ 16.7 ms (60 fps) desktop; ≤ 33 ms throttled mobile |
| Pan/zoom, 1,000 interactive DOM nodes + 1,500 SVG edges (culling on) | p95 ≤ 16.7 ms desktop |
| Drag one node in a 1,000-node flow | ≤ 1 node + its edges re-render per frame (asserted by render counters) |
| Marquee over 10,000 shapes | selection update ≤ 4 ms (R-tree query) |
| Load 1,000-node flow JSON → first paint | ≤ 300 ms desktop |
| Auto-layout 200 nodes (dagre, in worker) | ≤ 150 ms, main thread unblocked |
| Undo/redo | ≤ 1 frame |
| Memory, 10k shapes | ≤ 60 MB JS heap |

Techniques: per-record reactivity, culling with margin, efficient (debounced) zoom for LOD, `contain` on nodes, one transform on the layer (never per-node transforms on pan), rAF coalescing of input, no shadows/blur below LOD threshold, layout in a Worker.

## 7. Theming

- Every visual property is a token: `--ca-canvas-bg`, `--ca-canvas-grid` (derived from `--ca-border` via `color-mix`), `--ca-canvas-node-bg/-border/-radius/-shadow`, `--ca-canvas-edge`, `--ca-canvas-edge-active`, `--ca-canvas-port`, `--ca-canvas-selection` (from `--ca-brand-main`), `--ca-canvas-guide`, `--ca-canvas-error` (from `--ca-danger-*`). All new tokens pass `bun run lint:tokens`.
- Nodes, panels, minimap and controls follow `defaultStyle` (solid by default; glass/frosted only when the theme asks, and **never** blurred while the camera moves: blur is dropped at low LOD **[inference]**).
- Canvas2D cannot read `oklch()` reliably: reuse `tokenColor()` from `./map` (already returns `[r,g,b,a]` from a token) and re-read on scheme change (`colorScheme` store).
- JSON Canvas preset colors `"1"`–`"6"` map to theme palette tokens (red, orange, yellow, green, cyan, purple), which the spec explicitly allows ([JSON Canvas](https://jsoncanvas.org/spec/1.0/)).
- `forced-colors`: edges and selection use `CanvasText`/`Highlight` system colors; Canvas2D layer re-renders with system colors.

## 8. Accessibility plan (target WCAG 2.2 AA, AAA where cheap)

1. **One tab stop** for the canvas (`role="application"` is *not* used; the viewport is a `group` with `aria-roledescription="canvas"` and a label). Inside, arrow keys move focus spatially to the nearest node in that direction (R-tree query), `Tab` inside cycles in reading order (top-left → bottom-right) or graph order (topological for flows), roving `tabindex` per APG.
2. Focus ≠ selection: `Space` toggles selection, `Enter` opens the node (side panel), `Esc` returns to the canvas, `Delete` removes and focus moves to the neighbour (never `<body>`).
3. Keyboard connect: on a focused port, `C` starts a connection, arrows/typeahead pick the target port among valid ones, `Enter` confirms; equivalent menu action "Conectar a…" in the node's context menu.
4. Move/resize by keyboard: `Alt+arrows` move by grid, `Shift` ×10; announced through one polite live region (debounced), not assertive per keystroke.
5. Focus follows camera: focused node auto-panned into view (respect reduced motion: jump, don't animate).
6. **List view** (FlowEditor `listView`): same data as an outline (a `role="tree"` list owned by the kit; the package has no `Tree` component today), nodes in topological order, each with its outgoing connections as links ("Se Sim → Enviar proposta"), add/edit/delete/connect via forms. It is the mobile default under 768px and a toggle everywhere. It is a full editor, not a read-only summary.
7. Every edge has a text name (`from → to (label)`); errors are listed in an `Alert` with links that focus the node.
8. Contrast: ports, edges and focus rings ≥ 3:1 against the canvas (non-text contrast), labels ≥ 4.5:1.
9. Tests: axe on every docs route (existing `routes.axe.spec.ts`), plus keyboard-only Playwright flows for create → connect → delete → undo.

## 9. Mobile and touch plan

- One finger on empty canvas: pan (default) or marquee (`selectionOnDrag` mode, toolbar toggle). Two fingers: pinch-zoom + pan. Long-press: context menu (top-layer `ContextMenu`). Double-tap: zoom to point / edit.
- Ports and handles: visual size can be small, hit area is `--ca-touch-target` (44px) under `(pointer: coarse)` via a transparent hit pad, the global rule already in tokens.
- `touch-action: none` on the viewport only; panels and side sheets keep native scroll; iOS `gesture*` events prevented on the viewport so the page does not zoom.
- Side panel becomes `Sheet` under 768px; toolbar becomes a bottom `StickyActions`; heights use `var(--ca-vh)`, safe areas via `var(--ca-safe-*)`.
- FlowEditor defaults to list view on phones; canvas available as "Ver mapa" (read + light edits).
- Palm/pen: pen input (`pointerType === 'pen'`) draws in Whiteboard; touch pans while a pen is active.

## 10. Build vs adopt

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| A. Wrap `@xyflow/svelte` (MIT) | fastest flow editor; mature edges/handles; Svelte 5 runes API | flow-only (no whiteboard/freehand); `--xy-*` theme + own stylesheet to override; d3 deps; DOM-per-node ceiling; Tab-per-node a11y; our API becomes theirs + a wrapper (two conventions) | **Allowed as the R2K stopgap now** (V2 §5 already plans it); not the foundation |
| B. Fork/embed tldraw | best engine architecture | license forbids production use without key, telemetry, cannot be relicensed (§3.1) | **Rejected** |
| C. Embed Excalidraw (MIT) | whiteboard done, collab proven | React; its own UI and look; not a flow editor; not themeable to tokens | **Rejected** as base; reference for rendering split and merge rules |
| D. Konva-based (`roadmap` Wave 5) | scene graph + transformer quickly | Canvas-only (no DOM nodes, no a11y tree), duplicates hit-testing/events | **Superseded** |
| E. Own core (this proposal), borrow ideas, depend only on small MIT libs (`rbush`, `fractional-indexing`, optional `dagre`, `perfect-freehand`, `roughjs`, `yjs`) | one convention, tokens, a11y and touch done our way, tree-shakeable layers, MIT | engineering cost; we own the bugs | **Recommended** |

R2K path: ship V2 on `@xyflow/svelte` behind a thin app-level adapter that stores the flow in a JSON Canvas-compatible shape (`nodes[{id,type,x,y,width,height,data}]`, `edges[{id,fromNode,fromPort,toNode,toPort}]`). When `FlowEditor` reaches parity (Phase 1 exit), R2K swaps the component; the stored data does not migrate.

## 11. Bundle budget (gzip, measured by `scripts/size-limit.ts`, Svelte runtime included as today)

| Entry | Contents | Budget |
|---|---|---|
| `./canvas` core + primitives (DOM/SVG renderer) | camera, input, index, select, history, snap, bindings, io (JSON Canvas), Canvas/Node/Edge/Port/Background/Controls/Minimap | ≤ 28 kB |
| Canvas2D renderer (lazy, inside `./canvas`) | shape painters, DPR, worker bootstrap | ≤ 8 kB |
| `./canvas/flow` | FlowEditor, palette, validation, list view (dagre excluded) | ≤ 14 kB |
| `@dagrejs/dagre` (optional peer, loaded in a worker on demand) | layout | external |
| `./canvas/board` | whiteboard tools, sticky, text overlay, connectors (perfect-freehand/roughjs external) | ≤ 18 kB |
| `./canvas/yjs` | record↔Y.Map mapping, awareness cursors (yjs external) | ≤ 6 kB |
| export (lazy) | SVG/PNG export | ≤ 5 kB |

Budgets enter `size-limit.json` at first measurement and ratchet down only, per the existing script contract.

## 12. Test plan

- **Unit (`bun test`, no DOM)**: camera math (round-trip `screenToWorld∘worldToScreen = id` property tests, zoom-at-point invariance, clamps), wheel normalization (deltaMode 0/1/2, ctrl-pinch), R-tree vs brute force on random sets, marquee/lasso containment, snapping, history (undo/redo/coalescing/batch), bindings lifecycle, fractional index ordering, JSON Canvas round-trip and fixtures from the spec, Yjs mapping convergence (two docs, random ops, equal state).
- **Component (Vitest browser, real Chromium, existing setup)**: render, culling counts, focus/roving tabindex, keyboard connect, list view parity with canvas (same doc in, same doc out), Sheet panel on mobile viewport.
- **Gestures (Playwright)**: mouse drag/pan, wheel zoom, ctrl+wheel pinch, two-pointer pinch via CDP `Input.dispatchTouchEvent`, long-press menu, pen vs touch; WebKit project for `gesture*` path.
- **Visual (VRT, native baselines)**: Background variants per theme/scheme/style, node states (selected, focused, error, highlighted), edges, minimap, forced colors.
- **Performance (benchmarks)**: Playwright + `performance.measureUserAgentSpecificMemory`/tracing on fixtures (1k DOM nodes, 10k shapes); assert p95 frame time from a rAF sampler under CDP throttling; run at release in `test:full`, never as a load-sensitive gate in `validate` (AGENTS.md forbids load-sensitive gates); results stored and compared to the previous release (regression > 15% fails the release run).
- **a11y**: axe on docs routes; keyboard-only E2E flow.

## 13. Roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| 0. Spike (1 wk) | camera + input + DOM layer + R-tree; Safari/iOS pinch matrix on devices; benchmark harness | 1k DOM nodes pan at 60fps desktop; gesture matrix documented |
| 1. Flow MVP (R2K) (4–5 wk) | core (doc, history, select, snap, bindings, io), DOM+SVG renderers, primitives, `FlowEditor` with typed ports, validation, dagre layout, minimap, controls, side panel/Sheet, list view, docs + llms entries | Kira editor runs on it with feature parity to V2 §5; a11y keyboard flow green; budgets met |
| 2. Whiteboard (4 wk) | Canvas2D renderer, sticky/shapes/freehand/text overlay/connectors/frames, lasso, export SVG/PNG, layout-editor kit (replaces Konva plan) | AC layout editor ported; 10k shapes at 60fps |
| 3. Collaboration (3 wk) | `./canvas/yjs`, presence, cursors, follow mode, collab-safe undo | two-client convergence tests; cursors at 30Hz without frame drops |
| 4. Scale (as needed) | OffscreenCanvas worker renderer, WebGL renderer (optional peer), incremental loading | only if a consumer needs >10k shapes or a profile shows main-thread saturation |

Estimates are **[inference]** for one engineer and should be re-planned after Phase 0.

## 14. Risks

| Risk | Mitigation |
|---|---|
| Scope creep toward "build Figma" | layered entries; non-goals list; each phase has a named consumer |
| Safari pinch/gesture quirks; WebKit historically could not disable page pinch ([Figma 2015](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/)) | Phase 0 device matrix; both ctrl+wheel and `gesture*` paths; WebKit Playwright project |
| DOM node ceiling | culling + LOD; Canvas2D for bulk; budgets enforced by benchmarks |
| Text blur/measurement inside scaled DOM (the Miro/CodeMirror case) | measure in world units via `ResizeObserver`; document that embedded editors must be transform-aware; edit overlays rendered at scale 1 when zoom ≠ 1 if needed |
| a11y of a spatial UI | list view is a full editor; keyboard connect; tested flows |
| Licenses: tldraw (commercial), elkjs (EPL/GPL) | no tldraw code; elkjs only as an app-chosen optional peer |
| R2K timeline vs foundation timeline | R2K ships on xyflow now with a JSON Canvas-shaped store; swap later without data migration |
| Maintenance burden of an engine | small MIT deps where they exist; pure core with property tests; perf benchmarks at release |

## 15. Open questions

1. `rbush` dependency vs in-house R-tree (decide by Phase 0 size/perf numbers).
2. Is `./canvas/flow` a separate subpath or exported from `./canvas` (tree-shaking may make one subpath enough; measure).
3. PDF export through `./pdf` (pdfmake) or SVG → print only.
4. Owner sign-off on elkjs license posture.
