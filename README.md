<h1 align="center">Drawflow</h1>

<p align="center">
  Flow editor for the browser: nodes, ports and connections in a <code>&lt;div&gt;</code>, in plain JavaScript and without dependencies.
</p>

<p align="center">
  <a href="https://github.com/vanlee-araujo/Drawflow/releases"><img alt="version" src="https://img.shields.io/github/package-json/v/vanlee-araujo/Drawflow?color=green"></a>
  <a href="https://github.com/vanlee-araujo/Drawflow/actions/workflows/test.yml"><img alt="tests" src="https://github.com/vanlee-araujo/Drawflow/actions/workflows/test.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/github/license/vanlee-araujo/Drawflow"></a>
</p>

<p align="center">
  <a href="https://vanlee-araujo.github.io/Drawflow/docs/playground.html">Playground</a> ·
  <a href="docs/MANUAL.md">Manual</a> ·
  <a href="docs/API.md">API reference</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="ROADMAP.md">Roadmap</a>
</p>

![Demo](docs/drawflow.gif)

Drawflow is a maintained continuation of [Drawflow by Jero Soler](https://github.com/jerosoler/Drawflow), based on its
0.0.60. It keeps the same API and data format, fixes long-standing issues of the original and adds the features its
users asked for most. Without the new options it works like 0.0.60, apart from the documented fixes.

## Features

**Editing**
- Drag nodes, multiple inputs and outputs, multiple connections
- Reroute points on connections, labels on connections
- Multi-selection, locked nodes, snap to grid, node bounds
- Undo and redo
- Fields inside nodes bound to the node data (`df-*`)

**Connections**
- Arrows and vertical direction
- Validation before a connection is created or removed
- Loop for connections to a node behind the output
- Classes by source node type, highlight of the target node while dragging

**View and layout**
- Zoom and pan, from the mouse, touch or code
- `zoomFit`, `centerNode` and `autoLayout` (with [dagre](https://github.com/dagrejs/dagre), optional)
- Optional minimap and flow previews (`renderPreview`)
- Modules: separate flows in the same editor

**Integration**
- Import and export as JSON, with repair of broken connections on import
- Optional sanitizer for the HTML of nodes (`sanitize_html`), for flows from untrusted sources
- Events for every change
- Editor modes `edit`, `fixed` and `view`
- Vue 2, Vue 3 and Nuxt; TypeScript types included
- Colors as CSS variables; mobile support

## Installation

**CDN** (fixed version, see the [releases](https://github.com/vanlee-araujo/Drawflow/releases)):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vanlee-araujo/Drawflow@0.3.0/dist/drawflow.min.css">
<script src="https://cdn.jsdelivr.net/gh/vanlee-araujo/Drawflow@0.3.0/dist/drawflow.min.js"></script>
```

**npm**, from this repository:

```bash
npm i github:vanlee-araujo/Drawflow#0.3.0
```

The `drawflow` package on the npm registry is the original 0.0.60, without the changes of this project.

**Download**: copy the `dist/` folder of a release into your project.

## Quick start

```html
<div id="drawflow" style="width: 100%; height: 600px"></div>
```

```javascript
import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';

const editor = new Drawflow(document.getElementById('drawflow'));
editor.start();

const source = editor.addNode('source', 0, 1, 50, 100, 'source', { name: '' }, '<input type="text" df-name>');
const target = editor.addNode('target', 1, 0, 400, 100, 'target', {}, 'Target');
editor.addConnection(source, target, 'output_1', 'input_1');

editor.on('connectionCreated', connection => console.log(connection));
const data = editor.export();   // JSON of every module
editor.import(data);
```

With CommonJS: `const Drawflow = require('drawflow')`.

### Options

Options are properties of the editor, set before `start()`:

```javascript
editor.reroute = true;                                   // reroute points
editor.connection_arrow = 'end';                         // arrows
editor.history = true;                                   // undo and redo
editor.connection_validator = ({ output_id, input_id }) => output_id !== input_id;
editor.start();
```

The full list of options, methods and events is in the [API reference](docs/API.md).

### Vue and Nuxt

```javascript
// Vue 2
import Vue from 'vue';
this.editor = new Drawflow(element, Vue, this);

// Vue 3
import { h, getCurrentInstance, render } from 'vue';
const Vue = { version: 3, h, render };
const internalInstance = getCurrentInstance();
editor.value = new Drawflow(element, Vue, internalInstance.appContext.app._context);
```

Vue components are registered with `registerNode(name, component, props, options)` and created with
`typenode = 'vue'`. In Nuxt, add `build: { transpile: ['drawflow'] }` to `nuxt.config.js`.

## Documentation

| Document | Content |
|---|---|
| [Manual](docs/MANUAL.md) | What Drawflow can do and how the pieces fit together |
| [API reference](docs/API.md) | Options, methods, events, data format and CSS variables |
| [Playground](docs/playground.html) | Every feature in one page (open it from a clone, or [online](https://vanlee-araujo.github.io/Drawflow/docs/playground.html)) |
| [Architecture](ARCHITECTURE.md) | Source layout, flows and design decisions |
| [Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md) · [Proposals](PROPOSALS.md) | What was delivered, what is planned and what is under discussion |
| [Security policy](SECURITY.md) | How to report a vulnerability |

Other examples: the [original demo](docs/index.html) and Drawflow in a [custom element](docs/drawflow-element.html)
(based on [LitElement](https://lit.dev)). The [theme generator](https://jerosoler.github.io/drawflow-theme-generator/) of
the original project builds a theme visually.

## Development

With Docker Compose (nothing installed on the host):

```bash
cp .env.example .env              # set HOST_UID and HOST_GID to your `id -u` and `id -g`
docker compose run --rm build     # builds and writes the CDN files to dist/
docker compose --profile tools run --rm test   # browser tests (Chromium, Firefox and WebKit)
```

The GitHub Actions workflow builds and tests the same way with npm (`npm ci`, `npm run build`, `npm test`).

Each fix or feature is also kept as a small branch `pr/<topic>`, made from the original code with one subject per
branch, so that it can be offered to the original project on its own.

## Credits

Drawflow is created by [Jero Soler](https://github.com/jerosoler/Drawflow). Some changes come from pull requests and forks
of the original project, under the same MIT license:

- Repair of duplicated and one-sided connections on import, dragging outside the container: ideas from
  [hawwwran-simpleway/Drawflow](https://github.com/hawwwran-simpleway/Drawflow).
- Container classes other than the first one (issue #469): idea from [pavlyuts](https://github.com/pavlyuts) (PR #141).
- Outputs with non-sequential names on import (issue #808): idea from Daniel Vidal Cussi ([danieldvc](https://github.com/danieldvc), PR #260).
- Data keys with characters that are invalid in CSS selectors (ex. `,` and `|`): fix by yiiouo
  ([rni-l/Drawflow](https://github.com/rni-l/Drawflow), issue #336), extended to all characters with `CSS.escape`.
- Delete button with the `✕` symbol: Urban Sanden ([urre/Drawflow](https://github.com/urre/Drawflow), PR #666).
- Reuse of `contextmenuDel()`: Filip Chytil ([filchy](https://github.com/filchy), PR #579).
- `moduleChanged` after the module is drawn and the new `moduleChanging`: Wayne Ellis ([codemwnci](https://github.com/codemwnci), PR #683).
- `zoom_use_ctrl_key` option: ftab ([eviltik](https://github.com/eviltik), PR #648).
- Loop for connections to a node behind the output: Guillermo Gefaell ([konum](https://github.com/konum), PR #947).
- Connection classes by source node type, highlight of the target node while dragging a connection: idea and first
  code by Mouhamed Assafiri / Mo-WW ([mofolo/Drawflow](https://github.com/mofolo/Drawflow)).
- Ideas for multi-selection, `centerNode` and `selectNode`: the [brneas](https://github.com/brneas/Drawflow) and
  [DanieleMarrone](https://github.com/DanieleMarrone/Drawflow) forks.

## License

[MIT](LICENSE), copyright (c) 2020 Jero Soler.
