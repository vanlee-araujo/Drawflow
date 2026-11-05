# Roadmap

Planned changes for this fork, from the open issues and pull requests of the original project
and from other forks. Each one becomes a release and a pull request to the original.

## Next

- [ ] **TypeScript types**: ship a complete `drawflow.d.ts` with `"types"` in `package.json`, and send the
  update to DefinitelyTyped (`@types/drawflow` lacks 11 methods, 11 options and 3 events). jerosoler/Drawflow#640, jerosoler/Drawflow#804
- [ ] **Protect nodes and connections from removal**: `node_remove_validator` and `connection_remove_validator`,
  like `connection_validator`, for the Delete key, the ✕ button and the methods. jerosoler/Drawflow#10, jerosoler/Drawflow#826, jerosoler/Drawflow#931
- [ ] **Colors with CSS variables** (`--drawflow-connection-color` and others), including the arrow in Safari.
  Idea from the hawwwran-simpleway fork
- [ ] **Labels on connections**, saved in the export and without breaking reroute. jerosoler/Drawflow#18, jerosoler/Drawflow#704, jerosoler/Drawflow#874, jerosoler/Drawflow#868

## Later

- [ ] **Flow preview renderer**: draw any flow (in the `export()` format) as a small picture in any element:
  boxes and connections, colored by a class or status. Base for the two items below
- [ ] **Minimap** as an optional file, from the author's [minimap example](https://github.com/jerosoler/drawflow-minimap-example):
  the whole flow and the visible area; click or drag to move. jerosoler/Drawflow#94
- [ ] **Sub-flow preview in a node**: a node shows the picture of another flow (a module, or data of the app),
  for example the sub-steps of a task, without opening it; double click opens it. Real hierarchy (ports mapped
  to inner start and end nodes) only if an application needs it
- [ ] **Lock nodes**: a node that cannot move or be removed, while the others can. jerosoler/Drawflow#842, jerosoler/Drawflow#904
- [ ] **Select and center a node from code** (`selectNode`, `centerNode`; idea from the DanieleMarrone fork). jerosoler/Drawflow#643, jerosoler/Drawflow#723
- [ ] **Snap to grid** while dragging nodes. jerosoler/Drawflow#129
- [ ] **Keep nodes inside an area** (no negative positions, optional boundary). jerosoler/Drawflow#941, jerosoler/Drawflow#554, jerosoler/Drawflow#606
- [ ] **Labels on inputs and outputs**. jerosoler/Drawflow#785, jerosoler/Drawflow#323
- [ ] **Delete button position on touch screens**. jerosoler/Drawflow#407, jerosoler/Drawflow#801
- [ ] **Context menu event on connections** with the connection data. jerosoler/Drawflow#858, jerosoler/Drawflow#843
- [ ] **Undo / redo**. jerosoler/Drawflow#31, jerosoler/Drawflow#889
- [ ] **Multi-selection**, copy and paste (ideas from the brneas fork). jerosoler/Drawflow#50, jerosoler/Drawflow#322
- [ ] **Faster import** of large flows. jerosoler/Drawflow#927, jerosoler/Drawflow#825, jerosoler/Drawflow#879, jerosoler/Drawflow#672
- [ ] **Theme generator** aware of the new classes (arrows, vertical, target highlight)
- [ ] Review the remaining pull requests of the original: start a connection from an input (jerosoler/Drawflow#925),
  node content as an element (jerosoler/Drawflow#932), Vue props (jerosoler/Drawflow#486), port data types (jerosoler/Drawflow#448)
- [ ] Reroute points from dagre routes in `autoLayout`

## Project

- [ ] Run the Playwright tests on GitHub Actions for every push and pull request
- [ ] Update the build tools (webpack 4, gulp 4; the original has Dependabot pull requests jerosoler/Drawflow#893 to jerosoler/Drawflow#906)
- [ ] Publish on npm under a scoped name, so `npm i` installs this fork
- [ ] Open the pull requests to the original project

## Done

- 0.1.2: playground page, README for the fork, this roadmap
- 0.1.1: `zoomFit`, `autoLayout` with dagre
- 0.1.0: arrows, vertical direction, connection validation, layout API, 20+ fixes of open issues, manual
