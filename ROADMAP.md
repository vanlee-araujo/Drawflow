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

- [ ] **Minimap** as an optional file, from the author's [minimap example](https://github.com/jerosoler/drawflow-minimap-example). jerosoler/Drawflow#94
- [ ] **Undo / redo**. jerosoler/Drawflow#31, jerosoler/Drawflow#889
- [ ] **Multi-selection**, copy and paste (ideas from the brneas fork). jerosoler/Drawflow#50, jerosoler/Drawflow#322
- [ ] **Faster import** of large flows. jerosoler/Drawflow#927, jerosoler/Drawflow#825, jerosoler/Drawflow#879, jerosoler/Drawflow#672
- [ ] **Theme generator** aware of the new classes (arrows, vertical, target highlight)
- [ ] Review the remaining pull requests of the original: start a connection from an input (jerosoler/Drawflow#925),
  node content as an element (jerosoler/Drawflow#932), Vue props (jerosoler/Drawflow#486), port data types (jerosoler/Drawflow#448)
- [ ] Reroute points from dagre routes in `autoLayout`

## Done

- 0.1.2: playground page, README for the fork, this roadmap
- 0.1.1: `zoomFit`, `autoLayout` with dagre
- 0.1.0: arrows, vertical direction, connection validation, layout API, 20+ fixes of open issues, manual
