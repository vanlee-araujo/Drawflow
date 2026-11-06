# Roadmap

Ideas and planned changes for this fork, from the open issues and pull requests of the original project,
from other forks and from useful side libraries. It is a working list: items are not tied to versions or tags.

## Next

- [ ] Send the types to DefinitelyTyped (`@types/drawflow`), for users of the original. jerosoler/Drawflow#640, jerosoler/Drawflow#804
- [ ] **Faster import** of large flows. jerosoler/Drawflow#927, jerosoler/Drawflow#825, jerosoler/Drawflow#879, jerosoler/Drawflow#672
- [ ] **Labels on inputs and outputs**. jerosoler/Drawflow#785, jerosoler/Drawflow#323
- [ ] **Delete button position on touch screens**. jerosoler/Drawflow#407, jerosoler/Drawflow#801
- [ ] **Context menu event on connections** with the connection data. jerosoler/Drawflow#858, jerosoler/Drawflow#843
- [ ] **Copy and paste** of the selected nodes (ideas from the brneas fork)
- [ ] **Real sub-flows**: ports mapped to inner start and end nodes, only if an application needs it
- [ ] **Theme generator** aware of the new classes and variables
- [ ] Review the remaining pull requests of the original: start a connection from an input (jerosoler/Drawflow#925),
  node content as an element (jerosoler/Drawflow#932), Vue props (jerosoler/Drawflow#486), port data types (jerosoler/Drawflow#448)
- [ ] Reroute points from dagre routes in `autoLayout`

## Project

- [ ] Publish on npm under a scoped name, so `npm i` installs this fork
- [ ] Open the pull requests to the original project

## Side libraries

Optional libraries that work well with Drawflow; the fork keeps no required dependency.

- **[dagre](https://github.com/dagrejs/dagre)** (in use, optional): layered layout for `autoLayout`
- **[elkjs](https://github.com/kieler/elkjs)** (to evaluate): layered layout that also places ports and routes
  edges with bends; larger than dagre. Could be a second engine for `autoLayout`

## Done

- Removal validators, locked nodes, `selectNode` and `centerNode`, multi-selection, snap to grid, node bounds,
  labels on connections, CSS variables, undo and redo, `renderPreview`, minimap, TypeScript types,
  tests in the repository with GitHub Actions, webpack 5 and gulp 5
- Source split by subject in `src/parts/`, with one `dist/drawflow.min.js`
- 0.1.2: playground page, README for the fork, this roadmap
- 0.1.1: `zoomFit`, `autoLayout` with dagre
- 0.1.0: arrows, vertical direction, connection validation, layout API, 20+ fixes of open issues, manual
