# Architecture

How Drawflow is built: the components, their limits, the main flows and the decisions behind them.
For what the library does, see the [manual](docs/MANUAL.md); for the public API, the [API reference](docs/API.md).

## Components

| Component | Path | Role |
|---|---|---|
| Editor core | `src/drawflow.js` | `Drawflow` class: options and state (constructor), `start()`, `load()`, the event bus (`on`, `removeListener`, `dispatch`) and id helpers (`nodeKey`, `nodeElementId`, `getUuid`) |
| Parts | `src/parts/*.js` | Methods of the editor grouped by subject, mixed into `Drawflow.prototype` |
| Minimap | `src/drawflow-minimap.js` | Optional `DrawflowMinimap` class, built as a separate file; uses only the public API of the editor |
| Styles | `src/drawflow.css` | Default look; every color is a `--drawflow-*` CSS variable |
| Types | `types/*.d.ts` | TypeScript declarations of the public API, written by hand |
| Build output | `dist/` | `drawflow.min.js`, `drawflow-minimap.min.js` (UMD), `drawflow.min.css`, `drawflow.style.js` (CSS as a LitElement module) |
| Tests | `test/` | Browser tests with Playwright in Chromium, Firefox and WebKit, run against `dist/` |
| Pages | `docs/playground.html`, `docs/index.html`, `index.html`, `test.html` | Playground of the fork, original demo, local demo and manual test page |

### Parts

| File | Subject |
|---|---|
| `interactions.js` | Mouse, touch and keyboard handlers: `click`, `position` (move), `dragEnd`, `contextmenu`, `key`, `dblclick`, pinch zoom |
| `nodes.js` | Nodes: `addNode`, `addNodeImport` (drawing from data), `df-*` field binding, inputs and outputs, removal, locking |
| `connections.js` | Connections: drawing, `addConnection`, `updateConnectionNodes` (redraw of the lines of a node), validation and removal |
| `curves.js` | SVG paths: `createCurvature` (horizontal and vertical), backward loop |
| `reroute.js` | Reroute points: create, remove, draw from data |
| `arrows.js` | SVG markers for arrows, `setConnectionArrow`, `setConnectionDirection` |
| `labels.js` | Text on connections |
| `data.js` | Modules, `export`, `import` and the repair of imported connections |
| `view.js` | Zoom, pan, `zoomFit`, `centerNode` |
| `layout.js` | `autoLayout` with dagre, passed in by the application |
| `selection.js` | Single and multiple selection, selection box, snap to grid and node bounds |
| `history.js` | Undo and redo |
| `preview.js` | `renderPreview`: a flow drawn as a small SVG |

## Limits

- **Drawflow draws and keeps the data; the meaning of a flow belongs to the application.** It does not run,
  save or validate flows by itself; it offers validators (`connection_validator`, `node_remove_validator`,
  `connection_remove_validator`) and events.
- **No dependency at run time.** Optional libraries (dagre) are passed in by the application.
- **Only the current module is in the DOM.** The other modules live only in `editor.drawflow`.
- **`editor.drawflow` is the source of truth**; the DOM is rebuilt from it on `import` and `changeModule`.
- Frameworks: Vue 2 and 3 are supported inside the core (`typenode = 'vue'`); other frameworks use HTML nodes.

## Data model

```text
editor.drawflow = { drawflow: { <module>: { data: { <node id>: node } } } }
node = { id, name, class, html, typenode, data, pos_x, pos_y, inputs, outputs, locked? }
```

- A connection is stored **on both sides**: in `outputs.<output>.connections` of the source node (with
  `points` and `label`) and in `inputs.<input>.connections` of the target node. Every change updates both.
- Node ids are keys of text; the methods accept `5`, `'5'` and `'node-5'` (`nodeKey`, `nodeElementId`).

## DOM model

```text
div.parent-drawflow (container)
└── div.drawflow (precanvas: CSS transform for pan and zoom)
    ├── div.parent-node > div#node-<id>.drawflow-node   (inputs, content, outputs)
    └── svg.connection.node_in_node-<in>.node_out_node-<out>.<output>.<input>
        └── path.main-path, circle.point
```

The identity of a connection is in the class list of its `svg`, in that order; several parts read it by
position (`classList[1]` to `classList[4]`).

## Flows

### Start

`start()` creates the precanvas, the arrow markers and binds the handlers of the container (mouse, touch,
pointer, wheel, keyboard, `input`, `dblclick`), plus `mousemove`/`mouseup` on `window` to keep dragging outside
the editor. A `ResizeObserver` redraws the lines when the container or a node changes size. A second call does
nothing.

### Drawing a connection

1. `click` on an output → `drawConnection` creates a temporary `svg` and fires `connectionStart`.
2. `position` → `updateConnection` redraws the temporary path; the node under the pointer gets
   `connection_target_class`.
3. `dragEnd` on an input (or on a node with `force_first_input`) → `validateConnection`, data on both sides,
   `connectionCreated`; otherwise the temporary `svg` is removed and `connectionCancel` fires.

### Moving a node

`position` moves the dragged nodes (`dragNodes`, with grid and bounds) and calls `updateConnectionNodes` for each
one, which measures the ports in the page (`getBoundingClientRect`) and rebuilds every path of the node.
`dragEnd` writes the positions and fires `nodeMoved`.

### Import

`import(data)` clears the editor, copies the data, repairs the connections (`repairConnections`: ids as text,
no duplicates, both sides present) and draws the current module (`load` → `addNodeImport`, `addRerouteImport`,
`updateConnectionNodes` for every node). It fires `import` unless asked not to.

### Undo and redo

With `history`, the editor listens to its own change events and, 150 ms after the last one, stores a JSON
snapshot of all modules (`history_limit` steps). Undo and redo `import` a snapshot without firing `import`.

## Build and tests

- `npm run build`: webpack 5 builds two UMD bundles (`Drawflow`, `DrawflowMinimap`); gulp 5 minifies the CSS and
  wraps it as `dist/drawflow.style.js`.
- `npm test`: `test/browser.test.js` opens `test/blank.html` from the disk in the three Playwright browsers, loads
  `dist/` and checks the public behavior.
- Docker: the `Dockerfile` has the stages `deps` (`npm ci`), `build` (`npm run build`), `test` (the
  `mcr.microsoft.com/playwright:v1.48.2-jammy` image, the same as the CI), `export` (copies `dist/` to a bind mount)
  and `cdn` (final image with only `/dist`). `docker-compose.yml` exposes `build` (writes `./dist`) and `test`
  (profile `tools`).
- CI: `.github/workflows/test.yml` runs the same build and tests with npm in the Playwright image.
- `dist/` is committed, so the CDN and `npm i github:…` work without a build.

## Decisions

- **Prototype mixins instead of classes.** The source is split by subject in `src/parts/`, and each part is an
  object of methods copied to `Drawflow.prototype` (`Object.defineProperty`, writable). The public API, `this`
  and the single `dist/drawflow.min.js` stay as in the original, and methods can still be replaced on an
  instance (for example `createCurvature`).
- **Compatibility first.** New options are off by default; without them the editor works like the original
  0.0.60, apart from documented fixes.
- **Optional libraries are injected.** `autoLayout(dagre, options)` receives dagre from the application, so the
  library keeps no dependency and the application chooses the version.
- **Snapshot history.** Undo and redo store the whole data as JSON instead of a list of commands: simple and
  correct for every change, at the cost of memory on very large flows.
- **Small upstream-friendly changes.** Each fix or feature is also kept as a branch `pr/<topic>` from the
  original code, one subject per branch, so the original project can take only what it wants.

## Known technical debt

Signals from `harpia code lint src` (harpia's default limits), kept as they are until a refactor is planned:

- `updateConnectionNodes` (`connections.js`, about 320 lines) repeats the same measurement code for each case of
  reroute points.
- `click` in `interactions.js` has a cyclomatic complexity of 44; `key`, `dragEnd` and `start` are above 15.
- `var` is still used in most of the code inherited from the original (279 places in `src/`).
- `nodes.js` has 613 lines, above the 600 lines of the project rule; the `insertObjectkeys` helper is repeated
  three times in it.
- The connection identity depends on the order of the classes of its `svg` (see [DOM model](#dom-model)).
