# Proposals

Ideas under analysis, not approved yet. An approved proposal moves to the [roadmap](ROADMAP.md).
Issue and pull request numbers refer to the [original project](https://github.com/jerosoler/Drawflow).

## Survey of the forks (2026-11-20)

The original project has 894 forks. 142 were pushed after being created, and 79 have commits that the original
does not have (GitHub compare of each fork's default branch with `jerosoler/Drawflow:master`). Forks with only
renames, builds, deletions, application code or test commits were left out. Each idea below lists the forks
where it appears; *done* means this project already has it.

### Already done here

| Idea | Forks |
|---|---|
| Multi-selection, move and delete together | brneas, TheRobotFox |
| Locked / undraggable nodes | saintmatthieu |
| Labels on connections | modaresimr (Drawflow-EdgeLabel), mokaddem |
| Undo and redo | decisionrules |
| `zoomFit`, CSS variables, repair of one-sided connections on import, dragging outside the editor | hawwwran-simpleway |
| `centerNode`, `selectNode` | DanieleMarrone, brneas |
| Connection classes by node type, drop on a node connects to its first input | mofolo |
| Loop for backward connections | konum |
| `zoom_use_ctrl_key` | eviltik |
| Reuse of `contextmenuDel` | filchy |
| TypeScript types | signait, phosph, LordDeatHunter, pantharius, hawwwran-simpleway, chriso86 |
| Prevent cycles, one connection per output | delgalaenza, sbglasius: possible with `connection_validator` (example in the manual) |

### Security

- **Sanitize node HTML** (imodoye94: sanitization and a strict mode for node rendering). Node HTML is written with
  `innerHTML` in `addNode` and in `addNodeImport` (`src/parts/nodes.js`), so a flow imported from an untrusted
  source can run scripts in the page (for example `<img onerror>`). Proposal: an option `sanitize_html` that
  receives a function (DOMPurify or the application's own), off by default, and a note in the manual. Risk:
  **medium** for applications that import flows from users.

### Connections and ports

- **Typed ports and compatibility** (pantharius, DeeFuse, RexLyc, labrax, TheRobotFox; original #448): data types
  on inputs and outputs, connections only between compatible types, one link per typed output. Partly covered by
  `connection_validator`; a declarative form would need types in the data format.
- **Ports on any side** (mrsherlock88): each port leaves or enters top, bottom, left or right, with the curve
  following that side. Goes beyond `connection_direction`, which applies to the whole editor.
- **Orthogonal (step) routing** (pawelciesielka): lines with right angles, routed around the end nodes, with a
  choice of side.
- **Start a connection from an input** (Matthew-05; original #925): already listed in the roadmap review.
- **Labels or HTML on inputs and outputs** (hubroot: `addNodeInput(id, html)`): matches the roadmap item
  *Labels on inputs and outputs*.
- **Named (wireless) connections** (hawwwran-simpleway): a port connected to another by a signal name, without a
  line.
- **`addReroutePoint` API** (phosph): reroute points from code.
- **Double click event on connections** (makken772, sksithik).
- **`updateSingleConnection`** (illusorium-studios/PipeDrawflow): move a connection to another port.
- **Return the new class from `addNodeInput` and `addNodeOutput`** (sysrun).

### Nodes and data

- **Custom node id in `addNode`** (Wolf-Byte, fabrice8), today only sequential numbers or `useuuid`.
- **Node content as an element** (n2ref; original #932): already listed in the roadmap review.
- **Update the HTML of a node** (brneas: `updateNodeHtmlFromId`).
- **Pass the node data to Vue components as props** (kellerkind87, LordDeatHunter; original #485, #486).
- **Render function as `typenode`** (signait): a function that draws the node content, for React, Svelte or others
  without Vue-specific code.
- **Data binding on text elements** (zunayed-relisource): `df-*` on `p` and `span`, shown as text.
- **Graph queries** (zunayed-relisource, mikebreeze): `getAllNodes`, nodes connected to a node or to a port.
- **Option to turn off field binding** (InDebted-Receive).
- **`nodeMoved` with the new position** (signait).
- **Ids as numbers in events** (kokmok). Conflicts with the current rule (ids as text, except in `nodeCreated`);
  changing it would break applications. Not recommended.

### Interaction and view

- **Auto-pan near the edge** while dragging a node or a connection (hawwwran-simpleway).
- **Trackpad and two-finger pan** (InDebted-Receive): scroll to pan, pinch to zoom.
- **Grid background that follows the canvas** (hawwwran-simpleway), to go with `snap_grid`.
- **Move cursor while dragging** (decisionrules).
- **Stop dragging when the window loses focus** (phosph).
- **Highlight of the nodes connected to the selected one; search of nodes** (DanieleMarrone).
- **Resizable textareas inside nodes** (brneas).

### Performance and robustness

- **Batch the redraw of connections during a drag** (hawwwran-simpleway): one redraw per animation frame. Related
  to the roadmap item *Faster import*.
- **Connection identity without class positions** (hawwwran-simpleway): read the ids of a connection from data
  attributes instead of `classList[1..4]` (see [Architecture](ARCHITECTURE.md#known-technical-debt)).
- **Silent mode** (signait, phosph): change the editor from code without firing events.

### Code and project

- **Modular TypeScript source** (hawwwran-simpleway, phosph, chriso86, mewcoder): a full rewrite would make the
  `pr/*` branches hard to offer to the original; the parts in `src/parts/` are a first step in that direction.
- **JSDoc of the public API** (corneil).
- **`var` to `const`/`let`** (illusorium-studios, DiogoM14, pantharius): 279 places in `src/` (harpia lint).
- **Security policy** (`SECURITY.md`, AbdulElahOthmanGwaith): how to report a vulnerability.

## Project

- **No CDN in the example pages**: `index.html` and `docs/index.html` load Font Awesome, SweetAlert2, Micromodal
  and Google Fonts from CDNs, and `docs/playground.html` loads dagre from jsDelivr. Vendor them in the project, with
  version, license and origin.
- **Split the files over 600 lines**: `src/parts/nodes.js` (613), `types/drawflow.d.ts` (759) and
  `test/browser.test.js` (798, one function of about 740 lines).
- **Elkjs as a second layout engine**: layered layout that also places ports and routes edges with bends; larger
  than dagre.
