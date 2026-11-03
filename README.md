[![npm](https://img.shields.io/npm/v/drawflow?color=green)](https://www.npmjs.com/package/drawflow)
![npm](https://img.shields.io/npm/dy/drawflow)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/drawflow)
[![GitHub license](https://img.shields.io/github/license/jerosoler/Drawflow)](https://github.com/jerosoler/Drawflow/blob/master/LICENSE)
[![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2Fjerosoler)](https://twitter.com/jerosoler)
# Drawflow

![Demo](https://github.com/jerosoler/Drawflow/raw/master/docs/drawflow.gif)

Simple flow library.

Drawflow allows you to create data flows easily and quickly.

Installing only a javascript library and with four lines of code.

⭐ [LIVE DEMO](https://jerosoler.github.io/Drawflow/)

🎨 [THEME EDIT GENERATOR](https://jerosoler.github.io/drawflow-theme-generator/)

## Table of contents
- [Features](#features)
- [Installation](#installation)
  - [Running](#running)
- [Mouse and  Keys](#mouse-and-keys)
- [Editor](#editor)
  - [Options](#editor-options)
- [Modules](#modules)
- [Nodes](#nodes)
  - [Node example](#node-example)
  - [Register Node](#register-node)
- [Methods](#methods)
  - [Methods example](#methods-example)
- [Events](#events)
  - [Events example](#events-example)
- [Export / Import](#export-/-import)
  - [Export example](#export-example)
- [Example](#example)
- [License](#license)

## Features
- Drag Nodes
- Multiple Inputs / Outputs
- Multiple connections
- Delete Nodes and Connections
- Add/Delete inputs/outputs
- Reroute connections
- Data sync on Nodes
- Zoom in / out
- Clear data module
- Support modules
- Editor mode `edit`, `fixed` or `view`
- Import / Export data
- Events
- Mobile support
- Vanilla javascript (No dependencies)
- NPM
- Vue Support component nodes && Nuxt

## Installation
Download or clone repository and copy the dist folder, CDN option Or npm.  
#### Clone
`git clone https://github.com/jerosoler/Drawflow.git`

#### CDN
```html
# Last
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jerosoler/Drawflow/dist/drawflow.min.css">
<script src="https://cdn.jsdelivr.net/gh/jerosoler/Drawflow/dist/drawflow.min.js"></script>
# or version view releases https://github.com/jerosoler/Drawflow/releases
<link rel="stylesheet" href="https://unpkg.com/drawflow@x.x.xx/dist/drawflow.min.css" />
<script src="https://unpkg.com/drawflow@x.x.xx/dist/drawflow.min.js"></script>
```

#### NPM
```javascript
npm i drawflow
```

### Typescript
External package. More info [#119](https://github.com/jerosoler/Drawflow/issues/119)
```javascript
npm install -D @types/drawflow
```

#### Import
```javascript
import Drawflow from 'drawflow'
import styleDrawflow from 'drawflow/dist/drawflow.min.css'
```

#### Require
```javascript
var Drawflow = require('drawflow')
var styleDrawflow = require('drawflow/dist/drawflow.min.css')
```

Create the parent element of **drawflow**.
```html
<div id="drawflow"></div>
```
### Running
Start drawflow.
```javascript
var id = document.getElementById("drawflow");
const editor = new Drawflow(id);
editor.start();
```
Parameter | Type | Description
--- | --- | ---
`id` | Object | Name of module
`render` | Object | It's for `Vue`.
`parent` | Object | It's for `Vue`. The parent Instance

### For vue 2 example.
```javascript
import Vue from 'vue'

// Pass render Vue
this.editor = new Drawflow(id, Vue, this);
```

### For vue 3 example.
```javascript
import { h, getCurrentInstance, render } from 'vue'
const Vue = { version: 3, h, render };

this.editor = new Drawflow(id, Vue);
// Pass render Vue 3 Instance
const internalInstance = getCurrentInstance()
editor.value = new Drawflow(id, Vue, internalInstance.appContext.app._context);
```

### Nuxt
Add to `nuxt.config.js` file
```javascript
build: {
    transpile: ['drawflow'],
    ...
  }
```

## Mouse and  Keys
- `del key` to remove element.
- `Right click` to show remove options (Mobile long press).
- `Left click press` to move editor or node selected.
- `Ctrl + Mouse Wheel` Zoom in/out (Mobile pinch).

## Editor
You can change the editor to **fixed** type to block. Only editor can be moved. You can put it before start.
```javascript
editor.editor_mode = 'edit'; // Default
editor.editor_mode = 'fixed'; // Only scroll
```
You can also adjust the zoom values.
```javascript
editor.zoom_max = 1.6;
editor.zoom_min = 0.5;
editor.zoom_value = 0.1;
```

### Editor options

Parameter | Type | Default | Description
--- | --- | --- | ---
`reroute` | Boolean | false | Active reroute
`reroute_fix_curvature` | Boolean | false | Fix adding points
`curvature` | Number | 0.5 | Curvature
`curvature_backward` | Boolean | false | Connection to a node behind the output (on the left; above in vertical) is drawn as a loop around the nodes
`backward_offset` | Number | 60 | Distance the loop goes out of the output / into the input
`backward_depth` | Number | 80 | Distance the loop goes below the lowest port (nodes on the same row)
`backward_row_gap` | Number | 120 | Vertical distance from which the loop crosses between rows instead of going below
`reroute_curvature_start_end` | Number | 0.5 | Curvature reroute first point and las point
`reroute_curvature` | Number | 0.5 | Curvature reroute
`reroute_width` | Number | 6 | Width of reroute
`line_path` | Number | 5 | Width of line
`force_first_input` | Boolean | false | Force the first input to drop the connection on top of the node
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
`connection_validator` | Function | null | Called with `{ output_id, input_id, output_class, input_class }` before a connection is created (by mouse or `addConnection`). Return `false` to block it

### Reroute
Active reroute connections. Use before `start` or `import`.
```javascript
editor.reroute = true;
```
Create point with double click on line connection. Double click on point for remove.

## Modules
Separate your flows in different editors.
```javascript
editor.addModule('nameNewModule');
editor.changeModule('nameNewModule');
editor.removeModule('nameModule');
// Default Module is Home
editor.changeModule('Home');
```
`removeModule` of the module on screen shows another existing module (or an empty `Home` when it was the last one).


## Nodes
Adding a node is simple.
```javascript
editor.addNode(name, inputs, outputs, posx, posy, class, data, html);
```
Parameter | Type | Description
--- | --- | ---
`name` | text | Name of module
`inputs` | number | Number of de inputs
`outputs` | number | Number of de outputs
`pos_x` | number | Position on start node left
`pos_y` | number | Position on start node top
`class` | text | Added classname to de node. Multiple classnames separated by space
`data` | json | Data passed to node
`html` | text | HTML drawn on node or `name` of register node.
`typenode` | boolean & text | Default `false`, `true` for Object HTML, `vue` for vue

You can use the attribute `df-*` in **inputs, textarea or select** to synchronize with the node data and **contenteditable**.

Atrributs multiples parents support `df-*-*...`

### Node example
```javascript
var html = `
<div><input type="text" df-name></div>
`;
var data = { "name": '' };

editor.addNode('github', 0, 1, 150, 300, 'github', data, html);
```
### Register Node

it's possible register nodes for reuse.
```javascript
var html = document.createElement("div");
html.innerHTML =  "Hello Drawflow!!";
editor.registerNode('test', html);
// Use
editor.addNode('github', 0, 1, 150, 300, 'github', data, 'test', true);

// For vue
import component from '~/components/testcomponent.vue'
editor.registerNode('name', component, props, options);
// Use for vue
editor.addNode('github', 0, 1, 150, 300, 'github', data, 'name', 'vue');
```

Parameter | Type | Description
--- | --- | ---
`name` | text | Name of module registered.
`html` | text | HTML to drawn or `vue` component.
`props` | json | Only for `vue`. Props of component. `Not Required`
`options` | json | Only for `vue`. Options of component. `Not Required`



## Methods
Other available functions.

Node ids are accepted as `5`, `'5'` or `'node-5'` in all methods.

Mehtod | Description
--- | ---
`zoom_in()` | Increment zoom +0.1
`zoom_out()` | Decrement zoom -0.1
`setZoom(value)` | Set zoom, limited to `zoom_min` and `zoom_max`. Ex: `0.8`
`setCanvasPosition(x, y)` | Move (pan) the editor canvas. Ex: `0, 0`
`setNodePosition(id, pos_x, pos_y)` | Move node and redraw its connections. Ex: `5, 100, 200`
`setConnectionArrow(arrow, size, offset)` | Change arrows of all connections. Ex: `'both'` or `'end', 16, 9`
`setConnectionDirection(direction)` | Change direction and redraw connections. Ex: `'vertical'`
`getNodeFromId(id)` | Get Info of node. Ex: id: `5`
`getNodesFromName(name)` | Return Array of nodes id. Ex: name: `telegram`
`removeNodeId(id)` | Remove node. Ex id: `node-x`
`updateNodeDataFromId` | Update data element. Ex: `5, { name: 'Drawflow' }`
`addNodeInput(id)` | Add input to node. Ex id: `5`
`addNodeOutput(id)` | Add output to node. Ex id: `5`
`removeNodeInput(id, input_class)` | Remove input to node. Ex id: `5`, `input_2`
`removeNodeOutput(id, output_class)` | Remove output to node. Ex id: `5`, `output_2`
`addConnection(id_output, id_input, output_class, input_class)` | Add connection. Ex: `15,16,'output_1','input_1'`
`removeSingleConnection(id_output, id_input, output_class, input_class)` | Remove connection. Ex: `15,16,'output_1','input_1'`
`updateConnectionNodes(id)` | Update connections position from Node Ex id: `node-x`
`removeConnectionNodeId(id)` | Remove node connections. Ex id: `node-x`
`getModuleFromNodeId(id)` | Get name of module where is the id. Ex id: `5`
`clearModuleSelected()` | Clear data of module selected
`clear()` | Clear all data of all modules and modules remove.

### Methods example

```javascript
editor.removeNodeId('node-4');
```

```javascript
// Block connections from a node to itself
editor.connection_validator = ({ output_id, input_id }) => output_id !== input_id;
```

## Events
You can detect events that are happening.

List of available events:

Event | Return | Description
--- | --- | ---
  `nodeCreated` | id | `id` of Node
  `nodeRemoved` | id | `id` of Node
  `nodeDataChanged` | id | `id` of Node df-* attributes changed.
  `nodeSelected` | id | `id` of Node
  `nodeUnselected` | true | Unselect node
  `nodeMoved` | id | `id` of Node
  `connectionStart` | { output_id, output_class } | `id` of nodes and output selected
  `connectionCancel` | true | Connection Cancel
  `connectionCreated` | { output_id, input_id, output_class, input_class } | `id`'s of nodes and output/input selected
  `connectionRemoved` | { output_id, input_id, output_class, input_class } | `id`'s of nodes and output/input selected
  `connectionSelected` | { output_id, input_id, output_class, input_class } | `id`'s of nodes and output/input selected
  `connectionUnselected` | true | Unselect connection
  `addReroute` | id | `id` of Node output
  `removeReroute` | id | `id` of Node output
  `rerouteMoved` | id | `id` of Node output
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

### Events example
```javascript
editor.on('nodeCreated', function(id) {
  console.log("Node created " + id);
})
```

## Export / Import
You can export and import your data. On import, connections are checked: node ids become text, duplicated connections are removed, and each connection is kept on both sides (output and input). If the data has no module with the current name (ex. no `Home`), the first module is shown.
```javascript
var exportdata = editor.export();
editor.import(exportdata);
```
### Export example
Example of exported data:
```json
{
    "drawflow": {
        "Home": {
            "data": {}
        },
        "Other": {
            "data": {
                "16": {
                    "id": 16,
                    "name": "facebook",
                    "data": {},
                    "class": "facebook",
                    "html": "\n        
\n          
 Facebook Message
\n        
\n        ",
                    "inputs": {},
                    "outputs": {
                        "output_1": {
                            "connections": [
                                {
                                    "node": "17",
                                    "output": "input_1"
                                }
                            ]
                        }
                    },
                    "pos_x": 226,
                    "pos_y": 138
                },
                "17": {
                    "id": 17,
                    "name": "log",
                    "data": {},
                    "class": "log",
                    "html": "\n            
\n              
 Save log file
\n            
\n            ",
                    "inputs": {
                        "input_1": {
                            "connections": [
                                {
                                    "node": "16",
                                    "input": "output_1"
                                }
                            ]
                        }
                    },
                    "outputs": {},
                    "pos_x": 690,
                    "pos_y": 129
                }
            }
        }
    }
}

```

### Arrows and direction

```javascript
editor.connection_arrow = 'end';           // before editor.start()
editor.connection_direction = 'vertical';
editor.start();

editor.setConnectionArrow('start');        // swap: arrows point into the outputs
editor.setConnectionDirection('horizontal');
```

- The arrow takes the color of its line, also on hover and when selected (`fill: context-stroke`). Browsers without `context-stroke` (Safari) use the fallback color: `.drawflow-arrow { fill: steelblue; }`. Set it to your line color.
- With `connection_direction = 'vertical'` the container gets the class `drawflow-vertical`. If you restyle ports, keep inputs on the top border and outputs on the bottom border.

## Example
View the complete example in folder [docs](https://github.com/jerosoler/Drawflow/tree/master/docs).  
There is also an [example](docs/drawflow-element.html) how to use Drawflow in a custom element. (based on [LitElement](https://lit-element.polymer-project.org)).  

## Credits
Drawflow is created by [Jero Soler](https://github.com/jerosoler/Drawflow). Some changes come from pull requests and forks of the project, under the same MIT license:

- Repair of duplicated and one-sided connections on import: idea from [hawwwran-simpleway/Drawflow](https://github.com/hawwwran-simpleway/Drawflow).
- Container classes other than the first one (issue #469): idea from pavlyuts ([pavlyuts](https://github.com/pavlyuts), PR #141).
- Outputs with non-sequential names on import (issue #808): idea from Daniel Vidal Cussi ([danieldvc](https://github.com/danieldvc), PR #260).
- Data keys with characters that are invalid in CSS selectors (ex. `,` and `|`): fix by yiiouo ([rni-l/Drawflow](https://github.com/rni-l/Drawflow), issue #336), extended to all characters with `CSS.escape`.
- Dragging outside the container: idea from [hawwwran-simpleway/Drawflow](https://github.com/hawwwran-simpleway/Drawflow).
- Delete button with the `✕` symbol: Urban Sanden ([urre/Drawflow](https://github.com/urre/Drawflow), PR #666).
- Reuse of `contextmenuDel()`: Filip Chytil ([filchy](https://github.com/filchy), PR #579).
- `moduleChanged` after the module is drawn and the new `moduleChanging`: Wayne Ellis ([codemwnci](https://github.com/codemwnci), PR #683).
- `zoom_use_ctrl_key` option: ftab ([eviltik](https://github.com/eviltik), PR #648).
- Loop for connections to a node behind the output: Guillermo Gefaell ([konum](https://github.com/konum), PR #947).

## License
MIT License
