# Changelog

What each version delivered. Versions follow [semantic versioning](https://semver.org); the issue and pull request
numbers refer to the [original project](https://github.com/jerosoler/Drawflow).

## 0.2.0 - 2026-11-06

Editing tools, previews and a project that tests itself. New options are off by default.

### Added
- Labels on connections: `setConnectionLabel`, saved in the export (#18, #704, #874, #868)
- Undo and redo: `history` option, Ctrl+Z, Ctrl+Y (#31, #889)
- Multi-selection: Ctrl/Shift + click, Shift + drag, Ctrl+A; the group moves and is deleted together (#50, #322)
- Minimap: optional `dist/drawflow-minimap.min.js` (#94)
- `renderPreview`: a flow as a small picture in any element, for example a sub-flow inside a node
- Protection: `node_remove_validator`, `connection_remove_validator`, `setNodeLocked` (#10, #826, #931, #842, #904)
- Dragging: `snap_grid` and `node_bounds` (#129, #941, #554)
- `selectNode`, `centerNode` (#643, #723)
- Colors as `--drawflow-*` CSS variables
- TypeScript types in `types/` (#640, #804)

### Fixed
- Lines drawn while the editor had no height (hidden tab or panel) stayed wrong until a node moved
- Safari lost the mouseup after a text selection (`-webkit-user-select`)

### Project
- Source split by subject in `src/parts/`, still one `dist/drawflow.min.js`
- Tests in `test/` with GitHub Actions; webpack 5, gulp 5, Node 20
- Playground with every feature

## 0.1.2 - 2026-11-04

### Added
- Playground page (`docs/playground.html`): nodes, connections, every option of the fork, export and import, live events
- README for the fork, with installation from this repository, and a roadmap

No changes in the library code since 0.1.1.

## 0.1.1 - 2026-11-03

### Added
- `zoomFit({ padding, minZoom, maxZoom })`: zoom and pan so that every node fits in the editor (#863, #821)
- `autoLayout(dagre, options)`: layered layout with dagre, passed in by the application (#781, #685, #759)

## 0.1.0 - 2026-11-03

First release of this fork, based on the original 0.0.60.

### Added
- Arrows on connections: `connection_arrow` = `end`, `start`, `both` (#57, #819)
- Vertical direction: inputs on top, outputs at the bottom (#20, #507, #806)
- Connection validation: `connection_validator`
- Layout from code: `setNodePosition`, `setZoom`, `setCanvasPosition`
- Loop for connections to a node behind the output: `curvature_backward` (#947, by konum)
- Connection classes by node type and highlight of the target node while dragging (based on mofolo/Drawflow)
- `zoom_use_ctrl_key` (#648, by eviltik) and the `moduleChanging` event (#683, by codemwnci)
- Manual (`docs/MANUAL.md`)

### Changed
- `moduleChanged` fires after the new module is drawn

### Fixed
- Deleting a node removed the wrong connection when ids are numbers (#535, #512)
- Duplicated and one-sided connections in imported data (#946)
- Node ids accepted as `5`, `'5'` or `'node-5'` in all methods (#899, #442)
- Zoom going past `zoom_min` / `zoom_max` (#883)
- Container with its own classes broke panning (#469)
- Delete key not working on the first click on a connection (#446)
- Imported outputs with non-sequential names (#808)
- Checkbox and radio fields after import (#783)
- Data keys with `,` or `|` (#336, by yiiouo)
- Dragging stuck when the pointer leaves the editor (#443, #857)
- Connections misaligned when a node changes size (#914, #938, #608)
- `start()` called twice doubled every event (#813)
- Import without the `Home` module; removing the module on screen (#222, #516)
- `clear()` in another module broke the editor
- Segment order with a single reroute point; empty class tokens; `createCurvature` called without `this`
