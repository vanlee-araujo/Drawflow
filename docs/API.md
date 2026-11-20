# API reference

Every option, method and event of Drawflow. The concepts behind them are in the [manual](MANUAL.md).

## Contents
- [Constructor](#constructor)
- [Options](#options)
- [Nodes](#nodes)
- [Methods](#methods)
- [Events](#events)
- [Data format](#data-format)
- [Arrows, direction and connection classes](#arrows-direction-and-connection-classes)
- [Minimap](#minimap)
- [CSS variables](#css-variables)

## Constructor

```javascript
const editor = new Drawflow(container, render, parent);
editor.start();
```

Parameter | Type | Description
--- | --- | ---
`container` | Element | Container element of the editor
`render` | Object | Only for Vue: `Vue` (Vue 2) or `{ version: 3, h, render }` (Vue 3)
`parent` | Object | Only for Vue: the parent instance (Vue 2) or `app._context` (Vue 3)

## Options

Options are properties of the editor. Set them before `start()`, unless the description says otherwise.

Parameter | Type | Default | Description
--- | --- | --- | ---
`reroute` | Boolean | false | Active reroute
`reroute_fix_curvature` | Boolean | false | Fix adding points
`curvature` | Number | 0.5 | Curvature
`curvature_backward` | Boolean | false | Connection to a node behind the output (on the left; above in vertical) is drawn as a loop around the nodes
`backward_offset` | Number | 60 | Distance the loop goes out of the output / into the input
`backward_depth` | Number | 80 | Distance the loop goes below the lowest port (nodes on the same row)
`backward_row_gap` | Number | 120 | Vertical distance from which the loop crosses between rows instead of going below
`reroute_curvature_start_end` | Number | 0.5 | Curvature reroute first point and last point
`reroute_curvature` | Number | 0.5 | Curvature reroute
`reroute_width` | Number | 6 | Width of reroute
`line_path` | Number | 5 | Width of line
`force_first_input` | Boolean | false | Dropping a connection anywhere on a node connects it to the node's first input
`editor_mode` | Text | `edit` | `edit` for edit, `fixed` for nodes fixed but their input fields available, `view` for view only
`zoom` | Number | 1 | Default zoom
`zoom_max` | Number | 1.6 | Default zoom max
`zoom_min` | Number | 0.5 | Default zoom min
`zoom_value` | Number | 0.1 | Default zoom value update
`zoom_last_value` | Number | 1 | Default zoom last value
`zoom_use_ctrl_key` | Boolean | true | Mouse wheel zooms only with the ctrl key pressed. `false` zooms with the wheel alone
`observe_node_resize` | Boolean | true | Redraw the connections of a node when its size changes (content loaded later, fonts, hidden tab). Set before `start()`
`draggable_inputs` | Boolean | true | Drag nodes on click inputs
`useuuid` | Boolean | false | Use UUID as node ID instead of integer index. Only affect newly created nodes, do not affect imported nodes
`connection_arrow` | Text | `none` | Arrow on connections: `none`, `end` (pointing into the input), `start` (pointing into the output) or `both`. Change it later with `setConnectionArrow`
`connection_arrow_size` | Number | 14 | Arrow length and width
`connection_arrow_offset` | Number | 12 | Distance from the port center to the arrow tip, so the tip stays outside the port. Use half of your port size (with border)
`connection_direction` | Text | `horizontal` | `horizontal`: inputs on the left, outputs on the right. `vertical`: inputs on top, outputs at the bottom, curves leave and enter vertically. Change it later with `setConnectionDirection`
`connection_target_class` | Text | `connection-target` | Class added to the node under the pointer while dragging a connection, when releasing there creates the connection (on an input, or anywhere on the node with `force_first_input`)
`node_remove_validator` | Function | null | Called with the node id before removing it (Delete key, ✕ button, `removeNodeId`). Return `false` to keep it
`connection_remove_validator` | Function | null | Called with `{ output_id, input_id, output_class, input_class }` before removing a connection. Return `false` to keep it
`snap_grid` | Number | 0 | Grid size for dragged nodes. `0` for no grid
`node_bounds` | Object | null | Limits for dragged nodes: `{ min_x, min_y, max_x, max_y }`, any of them. Ex: `{ min_x: 0, min_y: 0 }` for no negative positions
`multiselect` | Boolean | false | Ctrl/Shift + click and Shift + drag on the canvas select several nodes; they move and are deleted together; Ctrl+A selects all
`history` | Boolean | false | Undo and redo (Ctrl+Z, Ctrl+Y, `undo()`, `redo()`). Set before `start()`
`history_limit` | Number | 50 | Steps kept for undo
`sanitize_html` | Function | null | Called with the HTML of a node (`typenode` `false`) before it is written into the page, by `addNode` and `import`; returns the clean HTML. Ex: `html => DOMPurify.sanitize(html)`. The data keeps the original HTML
`connection_validator` | Function | null | Called with `{ output_id, input_id, output_class, input_class }` before a connection is created (by mouse or `addConnection`). Return `false` to block it

## Nodes

```javascript
editor.addNode(name, inputs, outputs, pos_x, pos_y, class, data, html, typenode);
```

Parameter | Type | Description
--- | --- | ---
`name` | text | Name of the node (not unique)
`inputs` | number | Number of inputs
`outputs` | number | Number of outputs
`pos_x` | number | Position on start node left
`pos_y` | number | Position on start node top
`class` | text | Class names added to the node, separated by space
`data` | json | Data passed to node
`html` | text | HTML drawn on node or `name` of register node.
`typenode` | boolean & text | Default `false`, `true` for Object HTML, `vue` for vue

Fields with a `df-<key>` attribute (`input`, `textarea`, `select`, `contenteditable`) are bound to
`data.<key>`; nested keys use dashes: `df-config-url` is `data.config.url`.

### Registered nodes

```javascript
editor.registerNode(name, html, props, options);
editor.addNode('github', 0, 1, 150, 300, 'github', data, name, true);   // HTML element
editor.addNode('github', 0, 1, 150, 300, 'github', data, name, 'vue');  // Vue component
```

Parameter | Type | Description
--- | --- | ---
`name` | text | Name of the registered node.
`html` | text | HTML to drawn or `vue` component.
`props` | json | Only for `vue`. Props of component. `Not Required`
`options` | json | Only for `vue`. Options of component. `Not Required`



## Methods

Node ids are accepted as `5`, `'5'` or `'node-5'` in all methods.

Method | Description
--- | ---
`zoom_in()` | Increment zoom +0.1
`zoom_out()` | Decrement zoom -0.1
`zoom_reset()` | Zoom back to 1
`setZoom(value)` | Set zoom, limited to `zoom_min` and `zoom_max`. Ex: `0.8`
`setCanvasPosition(x, y)` | Move (pan) the editor canvas. Ex: `0, 0`
`setNodePosition(id, pos_x, pos_y)` | Move node and redraw its connections. Ex: `5, 100, 200`
`setConnectionArrow(arrow, size, offset)` | Change arrows of all connections. Ex: `'both'` or `'end', 16, 9`
`setConnectionDirection(direction)` | Change direction and redraw connections. Ex: `'vertical'`
`setConnectionLabel(id_output, id_input, output_class, input_class, text)` | Text on a connection, saved in the export. An empty text removes it
`getConnectionLabel(id_output, id_input, output_class, input_class)` | Text of a connection
`setNodeLocked(id, locked)` / `isNodeLocked(id)` | A locked node cannot be dragged or removed. Saved in the export
`selectNode(id)` / `selectNodes(ids)` / `clearSelection()` / `getSelectedNodes()` | Selection from code
`centerNode(id)` / `centerCanvasOn(x, y)` | Pan so that a node or a point is in the center
`undo()` / `redo()` / `canUndo()` / `canRedo()` | History, with the `history` option
`renderPreview(element, options)` | Draw a flow as a small picture in an element. Options: `data` (an export) or `module`, `color(node)`, `nodeWidth`, `nodeHeight`, `padding`, `direction`
`zoomFit(options)` | Zoom and pan so that every node fits in the editor. Options: `padding` (20), `minZoom` (`zoom_min`; lower it to fit big flows), `maxZoom` (1)
`autoLayout(dagre, options)` | Arrange the nodes in layers with [dagre](https://github.com/dagrejs/dagre), loaded by you. Options: `direction` (`LR`, `TB`, `RL`, `BT`; default from `connection_direction`), `nodesep` (40), `ranksep` (70), `edgesep` (10), `fit` (true), `fitOptions` (for `zoomFit`). Reroute points are removed
`getNodeFromId(id)` | Get Info of node. Ex: id: `5`
`getNodesFromName(name)` | Return Array of nodes id. Ex: name: `telegram`
`getAllNodes(module)` | Ids of the nodes of a module, the current one by default
`getConnectedNodes(id, port)` | Ids of the nodes connected to a node, on every port or on one. Ex: `5` or `5, 'output_1'`
`updateNodeHtmlFromId(id, html)` | New HTML for a node created with HTML (`typenode` `false`): the `df-*` fields get the values of its data again and `sanitize_html` applies. Returns `false` for other nodes
`removeNodeId(id)` | Remove node. Ex id: `node-x`
`updateNodeDataFromId` | Update data element. Ex: `5, { name: 'Drawflow' }`
`addNodeInput(id)` | Add input to node and return its name (`'input_3'`). Ex id: `5`
`addNodeOutput(id)` | Add output to node and return its name (`'output_3'`). Ex id: `5`
`addReroutePoint(id_output, id_input, output_class, input_class, pos_x, pos_y, index)` | Reroute point from code, at the end of the points or at `index`. Saved in the data; drawn, like on import, only with `reroute`
`removeNodeInput(id, input_class)` | Remove input to node. Ex id: `5`, `input_2`
`removeNodeOutput(id, output_class)` | Remove output to node. Ex id: `5`, `output_2`
`addConnection(id_output, id_input, output_class, input_class)` | Add connection. Ex: `15,16,'output_1','input_1'`
`removeSingleConnection(id_output, id_input, output_class, input_class)` | Remove connection. Ex: `15,16,'output_1','input_1'`
`updateConnectionNodes(id)` | Update connections position from Node Ex id: `node-x`
`removeConnectionNodeId(id)` | Remove node connections. Ex id: `node-x`
`getModuleFromNodeId(id)` | Get name of module where is the id. Ex id: `5`
`clearModuleSelected()` | Clear data of module selected
`clear()` | Remove all modules and data, and go back to an empty `Home` module
`removeConnection()` | Remove the selected connection
`export()` | Return a copy of all data
`import(data, notifi)` | Replace all data and draw the current module. With `notifi` `false`, the `import` event is not fired

Modules: `addModule(name)`, `changeModule(name)` and `removeModule(name)`. The default module is `Home`;
removing the module on screen shows another existing module, or an empty `Home` when it was the last one.

## Events

`editor.on(event, callback)` listens, `editor.removeListener(event, callback)` stops listening and
`editor.dispatch(event, details)` fires an event, also with your own names.

Event | Return | Description
--- | --- | ---
`nodeCreated` | id | `id` of Node
`nodeRemoved` | id | `id` of Node
`nodeDataChanged` | id | `id` of Node df-* attributes changed.
`nodeSelected` | id | `id` of Node
`nodeUnselected` | true | Unselect node
`nodeMoved` | id | `id` of Node
`nodePositionChanged` | { id, pos_x, pos_y } | New position of a node, after a drag or `setNodePosition`
`nodeHtmlChanged` | id | `id` of Node, after `updateNodeHtmlFromId`
`connectionStart` | { output_id, output_class } | `id` of nodes and output selected
`connectionCancel` | true | Connection Cancel
`connectionCreated` | { output_id, input_id, output_class, input_class } | `id`'s of nodes and output/input selected
`connectionRemoved` | { output_id, input_id, output_class, input_class } | `id`'s of nodes and output/input selected
`connectionSelected` | { output_id, input_id, output_class, input_class } | `id`'s of nodes and output/input selected
`connectionDblClick` | { output_id, input_id, output_class, input_class } | Double click on a connection
`connectionUnselected` | true | Unselect connection
`addReroute` | id | `id` of Node output
`removeReroute` | id | `id` of Node output
`rerouteMoved` | id | `id` of Node output
`nodeLocked` | { id, locked } | Node locked or unlocked
`selectionChanged` | ids | `id`'s of the selected nodes (`multiselect`)
`connectionLabelChanged` | { output_id, input_id, output_class, input_class, label } | Text of a connection changed
`historyChanged` | { canUndo, canRedo } | Undo state changed
`moduleCreated` | name | `name` of Module
`moduleChanging` | name | `name` of Module, before the change
`moduleChanged` | name | `name` of Module, after the module is drawn
`moduleRemoved` | name | `name` of Module
`click` | event | Click event
`clickEnd` | event | Once the click changes have been made
`contextmenu` | event | Click second button mouse event
`mouseMove` | { x, y } | Position
`mouseUp` | event | MouseUp Event
`keydown` | event | Keydown event
`zoom` | zoom_level | Level of zoom
`translate` | { x, y } | Position translate editor
`import` | `import` | Finish import
`export` | data | Data export

## Data format

`export()` returns a copy of all modules; `import(data)` replaces them. On import, connections are checked: node
ids become text, duplicated connections are removed, and each connection is kept on both sides (output and
input). If the data has no module with the current name (ex. no `Home`), the first module is shown.

```json
{
  "drawflow": {
    "Home": { "data": {} },
    "Other": {
      "data": {
        "16": {
          "id": 16, "name": "facebook", "data": {}, "class": "facebook",
          "html": "<div class=\"title-box\">Facebook Message</div>", "typenode": false,
          "inputs": {},
          "outputs": { "output_1": { "connections": [ { "node": "17", "output": "input_1" } ] } },
          "pos_x": 226, "pos_y": 138
        },
        "17": {
          "id": 17, "name": "log", "data": {}, "class": "log",
          "html": "<div class=\"title-box\">Save log file</div>", "typenode": false,
          "inputs": { "input_1": { "connections": [ { "node": "16", "input": "output_1" } ] } },
          "outputs": {},
          "pos_x": 690, "pos_y": 129
        }
      }
    }
  }
}
```

In an output connection, `points` holds the reroute points (`[{ "pos_x", "pos_y" }]`) and `label` the text of the
connection. A locked node has `"locked": true`.

## Arrows, direction and connection classes

```javascript
editor.connection_arrow = 'end';           // before editor.start()
editor.connection_direction = 'vertical';
editor.start();

editor.setConnectionArrow('start');        // later: arrows point into the outputs
editor.setConnectionDirection('horizontal');
```

- The arrow takes the color of its line, also on hover and when selected (`fill: context-stroke`). Browsers
  without `context-stroke` (Safari) use the fallback color `.drawflow-arrow { fill: steelblue; }`; set it to your
  line color.
- Each connection, and each output port, gets `connection-<class>` for every class of its source node. Ex: a node
  with class `query` gives `connection-query`, so lines of each node type can have their own color.
- With `connection_direction = 'vertical'` the container gets the class `drawflow-vertical`. If you restyle
  ports, keep inputs on the top border and outputs on the bottom border.

## Minimap

Optional file: load `dist/drawflow-minimap.min.js` after Drawflow.

```javascript
const minimap = new DrawflowMinimap(editor, { width: 200, height: 140 });
minimap.destroy();
```

## CSS variables

All colors of `drawflow.css`, with their default values in the file: `--drawflow-node-background`,
`--drawflow-node-selected-background`, `--drawflow-node-border-color`, `--drawflow-node-color`,
`--drawflow-input-background`, `--drawflow-output-background`, `--drawflow-port-border-color`,
`--drawflow-connection-color`, `--drawflow-connection-hover-color`, `--drawflow-connection-selected-color`,
`--drawflow-point-stroke`, `--drawflow-point-fill`, `--drawflow-point-selected-fill`,
`--drawflow-delete-background`, `--drawflow-delete-color`, `--drawflow-label-background`,
`--drawflow-label-color`, `--drawflow-minimap-background`, `--drawflow-minimap-border`.
