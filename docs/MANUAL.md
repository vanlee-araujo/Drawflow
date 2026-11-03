# Drawflow manual

What Drawflow can do, and how the pieces fit together. The [README](../README.md) has the
installation, the full lists of options, methods and events, and short examples; this manual
explains the concepts behind them.

## Contents
- [What Drawflow is](#what-drawflow-is)
- [The editor](#the-editor)
- [Nodes](#nodes)
- [Node fields: `df-*`](#node-fields-df-)
- [Inputs, outputs and connections](#inputs-outputs-and-connections)
- [Reroute points](#reroute-points)
- [Modules](#modules)
- [Editor modes](#editor-modes)
- [Navigation: pan and zoom](#navigation-pan-and-zoom)
- [Mouse, keyboard and touch](#mouse-keyboard-and-touch)
- [Data format](#data-format)
- [Events](#events)
- [Styling: DOM structure and classes](#styling-dom-structure-and-classes)
- [Customizing behavior](#customizing-behavior)
- [Frameworks](#frameworks)
- [Layout from code](#layout-from-code)
- [Validating connections](#validating-connections)
- [Arrows and direction](#arrows-and-direction)
- [Styling connections by node type](#styling-connections-by-node-type)
- [Robustness](#robustness)
- [Known limitations](#known-limitations)

## What Drawflow is

A JavaScript library, without dependencies, that turns a `<div>` into a flow editor: boxes
(**nodes**) with entry points (**inputs**) and exit points (**outputs**), joined by curved lines
(**connections**). The user drags nodes, draws connections with the mouse or finger, and edits
fields inside the nodes. The application reads and writes the whole flow as JSON, and is told
about every change through events.

Drawflow draws and keeps the data; what a flow *means* (running it, validating it, saving it)
belongs to the application.

## The editor

```javascript
const editor = new Drawflow(document.getElementById('drawflow'));
editor.start();
```

- The constructor receives the container element (and, for Vue, the render function and the
  parent instance). Options are properties of the editor: set them **before `start()`** (some,
  like `reroute`, are read when nodes and connections are drawn).
- `start()` adds the class `parent-drawflow` to the container, creates the canvas inside it
  (`.drawflow`) and binds the mouse, touch and keyboard events.
- The container needs a size (width and height); the canvas fills it, and everything outside is
  hidden (`overflow: hidden`).
- `editor.drawflow` holds the data of all modules (see [Data format](#data-format)). Read it
  freely; to change it, use the methods, so that the drawing and the events stay in sync.

## Nodes

`addNode(name, inputs, outputs, pos_x, pos_y, class, data, html, typenode)` creates a node and
returns its id.

- **name**: any text. It is not unique; `getNodesFromName(name)` returns the ids of all nodes with
  that name, in every module.
- **inputs / outputs**: how many of each. They are named `input_1`, `input_2`… and
  `output_1`, `output_2`…; add or remove them later with `addNodeInput`, `addNodeOutput`,
  `removeNodeInput` and `removeNodeOutput`. Removing one renumbers the following ones and keeps
  their connections.
- **pos_x / pos_y**: position on the canvas, in canvas pixels (zoom and pan do not change them).
- **class**: classes added to the node element, separated by spaces. Use them for styling.
- **data**: an object that travels with the node (in the export) and is synchronized with the
  fields of its HTML (see [Node fields](#node-fields-df-)).
- **html**, depending on **typenode**:
  - `false` (default): an HTML string written into the node;
  - `true`: the name of an element registered with `registerNode(name, element)`; the node gets a
    copy of it;
  - `'vue'`: the name of a Vue component registered with `registerNode(name, component, props, options)`.
- Ids are sequential numbers, or UUIDs with `useuuid = true` (only for nodes created after it).

Other node methods: `getNodeFromId(id)` returns a copy of the node data; `updateNodeDataFromId(id, data)`
replaces its `data` and updates its fields; `removeNodeId('node-5')` removes the node and its
connections.

## Node fields: `df-*`

An `input`, `textarea`, `select` or `contenteditable` element inside the node with an attribute
`df-<key>` is bound to `data.<key>`:

- when the node is created or imported, the field gets the value from `data`;
- when the user types, `data` is updated and the event `nodeDataChanged` fires with the node id.

Nested keys use dashes: `df-config-url` is `data.config.url`.

## Inputs, outputs and connections

- A connection always goes **from an output to an input**. The user starts it by pressing on an
  output and releases it on an input (with `force_first_input = true`, releasing anywhere on a
  node uses its first input).
- An output can feed many inputs, and an input can receive many outputs. The same pair
  output → input is connected only once, and the mouse does not connect a node to itself.
- From code: `addConnection(id_output, id_input, 'output_1', 'input_1')` and
  `removeSingleConnection(...)` with the same arguments. `removeConnectionNodeId('node-5')`
  removes every connection of a node.
- The connection is stored on both sides: in the output (`outputs.output_1.connections`) and in
  the input (`inputs.input_1.connections`).
- The line is a cubic curve; `curvature` sets how round it is (0 is straight).
- Click on a line to select it; Delete or the `x` button removes it.

## Reroute points

With `reroute = true`, a double click on a selected connection adds a point that the user can
drag, to route the line around other nodes; a double click on the point removes it. Points are
saved in the output side of the connection (`points: [{ pos_x, pos_y }]`).

`reroute_fix_curvature = true` draws each segment as its own path (better curves while adding
points); `reroute_curvature`, `reroute_curvature_start_end` and `reroute_width` adjust the look.

## Modules

A module is a separate flow in the same editor (like tabs): `addModule(name)`,
`changeModule(name)`, `removeModule(name)`. Only the current module (`editor.module`, default
`Home`) is drawn; the others stay in the data. Changing modules resets zoom and pan.
`clearModuleSelected()` empties the current module; `clear()` removes all modules and data.

## Editor modes

`editor_mode`:

| Mode | Nodes | Fields inside nodes | Connections | Canvas pan |
|---|---|---|---|---|
| `edit` (default) | create, move, delete | editable | create, select, delete | yes |
| `fixed` | cannot move or be deleted | editable | cannot change | yes |
| `view` | cannot move or be deleted | not intended for editing | cannot change | yes |

With `draggable_inputs = false`, pressing inside a field of a node (in `edit` mode) does not
start dragging the node, which makes selecting text possible.

## Navigation: pan and zoom

- Pan: drag the empty canvas. `editor.canvas_x` / `editor.canvas_y` hold the offset; the event
  `translate` fires while it moves.
- Zoom: ctrl + mouse wheel, pinch on touch screens, or `zoom_in()`, `zoom_out()` and
  `zoom_reset()`. `zoom_min`, `zoom_max` and `zoom_value` (the step) limit it; `editor.zoom` holds
  the current level and the event `zoom` fires on each change.
- Positions of nodes and connections are always in canvas pixels; zoom and pan are a CSS
  transform of the canvas.

## Mouse, keyboard and touch

| Action | Result |
|---|---|
| Press and drag a node | moves it (event `nodeMoved` on release) |
| Press on an output and release on an input | creates a connection |
| Click on a node / connection | selects it |
| Delete (or Cmd+Backspace on Mac) | removes the selected node or connection (not while typing in a field) |
| Right click (long press on touch) on a selected node or connection | shows the `x` remove button |
| Drag the empty canvas | pans |
| Ctrl + wheel, pinch | zoom |
| Double click on a selected connection / on a point | adds / removes a reroute point (with `reroute`) |

## Data format

`export()` returns a copy of all modules; `import(data)` replaces everything and draws the current
module (`import(data, false)` does not fire the `import` event).

```text
{ drawflow: {
    <module name>: { data: {
      <node id>: {
        id, name, class, html, typenode,
        data: { ...field values },
        pos_x, pos_y,
        inputs:  { input_1:  { connections: [ { node: "<output node id>", input: "output_1" } ] } },
        outputs: { output_1: { connections: [ { node: "<input node id>", output: "input_1", points: [ {pos_x, pos_y} ] } ] } }
      } } } } }
```

Note the naming: in an input, `input` is the **output class** of the other node; in an output,
`output` is the **input class** of the other node. `html` is the template given when the node was
created, not the current content of the node.

## Events

`editor.on(name, callback)` listens; `editor.removeListener(name, callback)` stops listening;
`editor.dispatch(name, details)` fires any event, including your own names. Callbacks receive one
argument; node ids come as text, except in `nodeCreated`, which gives the id returned by
`addNode`. The full list is in the README; the main groups are:

- **Nodes:** `nodeCreated`, `nodeRemoved`, `nodeSelected`, `nodeUnselected`, `nodeMoved`,
  `nodeDataChanged`.
- **Connections:** `connectionStart`, `connectionCancel`, `connectionCreated`,
  `connectionRemoved`, `connectionSelected`, `connectionUnselected`. `addConnection` also fires
  `connectionCreated`; `import` fires only `import`.
- **Reroute:** `addReroute`, `removeReroute`, `rerouteMoved`.
- **Modules:** `moduleCreated`, `moduleChanging`, `moduleChanged`, `moduleRemoved`.
- **Editor:** `zoom`, `translate`, `import`, `export`, and the raw `click`, `clickEnd`,
  `contextmenu`, `mouseMove`, `mouseUp`, `keydown`.

## Styling: DOM structure and classes

```text
div.parent-drawflow              ← your container
└── div.drawflow                 ← canvas (moved and scaled for pan and zoom)
    ├── div.parent-node
    │   └── div#node-5.drawflow-node.<your classes>[.selected]
    │       ├── div.inputs  → div.input.input_1, div.input.input_2 …
    │       ├── div.drawflow_content_node   ← your HTML
    │       └── div.outputs → div.output.output_1 …
    └── svg.connection.node_in_node-6.node_out_node-5.output_1.input_1
        ├── path.main-path[.selected]
        └── circle.point[.selected]          ← reroute points
```

- Restyle with CSS over `drawflow.min.css`: `.drawflow-node`, `.drawflow-node.selected`,
  `.input`, `.output`, `.main-path`, `.main-path.selected`, `.point`, `.drawflow-delete` (the
  remove button). The [theme generator](https://jerosoler.github.io/drawflow-theme-generator/)
  builds a theme visually.
- Connections are absolutely positioned SVGs; their position follows the **center of the port
  elements**, so ports may have any size and place, as long as connections are redrawn with
  `updateConnectionNodes('node-5')` when a node changes size.
- The classes of a connection identify it: `node_in_node-<id>`, `node_out_node-<id>`, output
  class, input class.

## Customizing behavior

- **Curves:** `createCurvature(start_x, start_y, end_x, end_y, curvature, type)` returns the SVG
  path of every line; replace it on the editor to draw other shapes. `type` is `openclose` for a
  whole line, or `open`, `close`, `other` for reroute segments.
- **Validation:** `connection_validator` blocks a connection before it exists (see
  [Validating connections](#validating-connections)); listen to `nodeRemoved`, `connectionRemoved` to keep your own
  state.
- **Your own events:** `dispatch` and `on` work with any name.

## Frameworks

- **Vue 2 / 3:** pass the render (`Vue`, or `{ version: 3, h, render }`) and the parent instance to
  the constructor, register components with `registerNode` and create nodes with `typenode = 'vue'`.
- **Nuxt:** transpile the package (see the README).
- **Others (React, Angular, Svelte):** use HTML nodes (`typenode = false`) and read and write the
  node `data`, or render your component into the node element after `nodeCreated`.
- **TypeScript:** types are in the external package `@types/drawflow`.

## Layout from code

- `setNodePosition(id, x, y)` moves a node: its data, its element and its connections, and fires
  `nodeMoved`. Use it for automatic layout (for example with [dagre](https://github.com/dagrejs/dagre)).
- `setZoom(value)` sets the zoom inside `zoom_min` and `zoom_max`; `setCanvasPosition(x, y)` pans.
  Together they fit a drawing on screen.
- Node ids are accepted as `5`, `'5'` or `'node-5'` in every method.

## Validating connections

`connection_validator` is called before a connection is created, by the mouse or by
`addConnection`, with `{ output_id, input_id, output_class, input_class }`. Returning `false`
blocks it (the mouse gets `connectionCancel`). Typical rules: no cycles, one connection per input,
only some node types together.

```javascript
editor.connection_validator = ({ output_id, input_id }) => !reaches(input_id, output_id); // no cycles
```

## Arrows and direction

- `connection_arrow`: `'none'` (default), `'end'` (pointing into the input), `'start'` (pointing
  into the output, to show the flow the other way) or `'both'`. `connection_arrow_size` and
  `connection_arrow_offset` (distance from the port center to the tip; half of the port size)
  adjust it; `setConnectionArrow(arrow, size, offset)` changes everything later.
- The arrow takes the color of its line, also on hover and when selected. Safari has no
  `context-stroke`: there the arrow uses `.drawflow-arrow { fill }`; set it to your line color.
- `connection_direction = 'vertical'`: inputs on the top border, outputs on the bottom border, and
  curves that leave and enter vertically. The container gets the class `drawflow-vertical`;
  `setConnectionDirection(direction)` switches and redraws.
- `curvature_backward = true` draws a connection to a node behind the output (on the left; above in
  vertical) as a loop around the nodes, adjusted by `backward_offset`, `backward_depth` and
  `backward_row_gap`.

## Styling connections by node type

Each connection, and each output port, gets `connection-<class>` for every class of its source
node: a node with class `query` gives `.connection-query`. While a connection is dragged, the node
where releasing connects gets `connection_target_class` (default `connection-target`, with a
pulse in the default CSS).

## Robustness

- Connections of a node are redrawn when its size changes (content loaded later, fonts, a hidden
  tab shown again): `observe_node_resize`, default `true`.
- `import()` repairs the data: ids become text, duplicated connections are removed, and each
  connection is kept on both sides. Data without the current module shows its first module.
- Dragging keeps following the pointer outside the editor, and releasing outside ends it.
- `start()` twice does nothing the second time.
- `zoom_use_ctrl_key = false` zooms with the mouse wheel alone.
- `moduleChanging` fires before a module change and `moduleChanged` after the module is drawn.

## Known limitations

- Only the current module is drawn; there is no list of modules besides
  `Object.keys(editor.drawflow.drawflow)`.
- No undo, multi-selection, minimap or automatic layout.
- Very large flows (thousands of connections) are slow to import, because every connection is
  measured in the page.
- Safari draws arrows with the fallback color (no `context-stroke`).
